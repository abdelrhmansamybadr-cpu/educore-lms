import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final String otherUserName;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.otherUserName,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  bool _isLoading = true;
  List<dynamic> _messages = [];
  final TextEditingController _input = TextEditingController();
  final ScrollController _scroll = ScrollController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.instance.get(
        ApiEndpoints.conversationMessages(widget.conversationId),
      );
      final raw = res.data;
      final d = (raw is Map && raw['data'] != null) ? raw['data'] : raw;
      setState(() {
        _messages = d is List ? List<dynamic>.from(d) : <dynamic>[];
        _isLoading = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    _input.clear();

    final auth = context.read<AuthProvider>();
    final myId = auth.user?.id.toString() ?? '';

    setState(() {
      _messages.add({
        'id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
        'content': text,
        'senderId': myId,
        'createdAt': DateTime.now().toIso8601String(),
      });
      _sending = true;
    });
    _scrollToBottom();

    try {
      await ApiClient.instance.post(ApiEndpoints.sendMessage, data: {
        'conversationId': widget.conversationId,
        'content': text,
      });
      setState(() => _sending = false);
    } catch (_) {
      setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAr = auth.isAr;
    final myId = auth.user?.id.toString() ?? '';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withOpacity(0.1),
                child: Text(
                  widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.otherUserName.isNotEmpty ? widget.otherUserName : (isAr ? 'محادثة' : 'Chat'),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    isAr ? 'اضغط للمزيد' : 'Tap for info',
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ],
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, color: AppColors.border),
          ),
          actions: [
            IconButton(
              onPressed: _loadMessages,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              child: _isLoading
                  ? const Padding(padding: EdgeInsets.all(16), child: ListSkeletonLoader())
                  : _messages.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.border),
                              const SizedBox(height: 12),
                              Text(
                                isAr ? 'ابدأ المحادثة' : 'Start the conversation',
                                style: const TextStyle(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          itemCount: _messages.length,
                          itemBuilder: (_, i) => _buildBubble(_messages[i], myId, isAr),
                        ),
            ),
            Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      maxLines: 4,
                      minLines: 1,
                      textInputAction: TextInputAction.newline,
                      decoration: InputDecoration(
                        hintText: isAr ? 'اكتب رسالة...' : 'Type a message...',
                        hintStyle: const TextStyle(color: AppColors.textSecondary),
                        filled: true,
                        fillColor: AppColors.background,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _send,
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: _sending
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBubble(Map<String, dynamic> msg, String myId, bool isAr) {
    final isMe = msg['senderId']?.toString() == myId;
    final content = msg['content']?.toString() ?? '';
    final rawTime = msg['createdAt']?.toString();
    String timeStr = '';
    if (rawTime != null) {
      final dt = DateTime.tryParse(rawTime);
      if (dt != null) {
        final local = dt.toLocal();
        timeStr = '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: Text(
                widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : '?',
                style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isMe ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isMe ? 18 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 18),
                    ),
                    border: isMe ? null : Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    content,
                    style: TextStyle(
                      color: isMe ? Colors.white : AppColors.textPrimary,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ),
                if (timeStr.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    timeStr,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                  ),
                ],
              ],
            ),
          ),
          if (isMe) const SizedBox(width: 8),
        ],
      ),
    );
  }
}
