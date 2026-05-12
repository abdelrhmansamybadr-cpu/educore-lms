import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';

class _Message {
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime time;
  _Message({required this.role, required this.content}) : time = DateTime.now();
}

class AiTutorScreen extends StatefulWidget {
  const AiTutorScreen({super.key});

  @override
  State<AiTutorScreen> createState() => _AiTutorScreenState();
}

class _AiTutorScreenState extends State<AiTutorScreen> {
  final List<_Message> _messages = [];
  final TextEditingController _input = TextEditingController();
  final ScrollController _scroll = ScrollController();
  bool _sending = false;
  String _subject = '';

  final _subjects = ['Math', 'Science', 'English', 'History', 'Arabic', 'Physics', 'Chemistry', 'Biology'];

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    _input.clear();

    final auth = context.read<AuthProvider>();
    final userMsg = _Message(role: 'user', content: text);
    setState(() { _messages.add(userMsg); _sending = true; });
    _scrollToBottom();

    try {
      final history = _messages.take(_messages.length - 1).map((m) => {'role': m.role, 'content': m.content}).toList();
      final res = await ApiClient.instance.post(ApiEndpoints.aiTutorChat, data: {
        'messages': [...history, {'role': 'user', 'content': text}],
        if (_subject.isNotEmpty) 'subject': _subject,
        'language': auth.locale,
        'studentName': auth.user?.firstName,
      });
      final data = res.data;
      final reply = (data is Map ? data['data'] : data)?['content'] ?? data?['content'] ?? data?.toString() ?? '...';
      setState(() { _messages.add(_Message(role: 'assistant', content: reply.toString())); _sending = false; });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages.add(_Message(role: 'assistant', content: 'Error: ${e.toString()}'));
        _sending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final isAr = auth.isAr;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
            child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(isAr ? 'المدرس الذكي' : 'AI Tutor', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(isAr ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          ]),
        ]),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.border),
        ),
      ),
      body: Column(children: [
        // Subject chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(children: [
            _subjectChip(isAr ? 'الكل' : 'All', ''),
            ..._subjects.map((s) => _subjectChip(s, s)),
          ]),
        ),
        // Messages
        Expanded(
          child: _messages.isEmpty
              ? _emptyChat(isAr)
              : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _messages.length + (_sending ? 1 : 0),
                  itemBuilder: (ctx, i) {
                    if (i == _messages.length) return _typingIndicator();
                    return _buildBubble(_messages[i], isAr);
                  },
                ),
        ),
        // Input
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _input,
                maxLines: 3,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText: isAr ? 'اسأل أي شيء...' : 'Ask anything...',
                  hintStyle: const TextStyle(color: AppColors.textSecondary),
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _send,
              child: Container(
                width: 44, height: 44,
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: _sending
                    ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _subjectChip(String label, String value) {
    final selected = _subject == value;
    return GestureDetector(
      onTap: () => setState(() => _subject = value),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(color: selected ? Colors.white : AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  Widget _buildBubble(_Message msg, bool isAr) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 32, height: 32,
              decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
              child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
                border: isUser ? null : Border.all(color: AppColors.border),
              ),
              child: Text(
                msg.content,
                style: TextStyle(color: isUser ? Colors.white : AppColors.textPrimary, fontSize: 14, height: 1.5),
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _typingIndicator() {
    return Row(children: [
      Container(
        width: 32, height: 32,
        decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
        child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 16),
      ),
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: const Row(children: [
          _Dot(), SizedBox(width: 4), _Dot(delay: 200), SizedBox(width: 4), _Dot(delay: 400),
        ]),
      ),
    ]);
  }

  Widget _emptyChat(bool isAr) {
    final suggestions = isAr
        ? ['اشرح لي المعادلات التربيعية', 'ما هو الضوء؟', 'ساعدني في الجبر']
        : ['Explain quadratic equations', 'What is photosynthesis?', 'Help me with algebra'];
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 80, height: 80,
            decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
            child: const Icon(Icons.auto_awesome, color: AppColors.primary, size: 36),
          ),
          const SizedBox(height: 16),
          Text(
            isAr ? 'مرحباً! أنا مدرسك الذكي' : 'Hi! I\'m your AI Tutor',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            isAr ? 'اسألني أي سؤال في أي مادة' : 'Ask me anything about any subject',
            style: const TextStyle(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...suggestions.map((s) => GestureDetector(
            onTap: () { _input.text = s; _send(); },
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white, borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(s, style: const TextStyle(color: AppColors.primary, fontSize: 13)),
            ),
          )),
        ]),
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({this.delay = 0});

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 1.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    Future.delayed(Duration(milliseconds: widget.delay), () { if (mounted) _ctrl.forward(); });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
    );
  }
}
