import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<dynamic> _books = [];
  List<dynamic> _loans = [];
  bool _loadingBooks = true;
  bool _loadingLoans = true;
  final _searchCtrl = TextEditingController();
  String _search = '';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadBooks();
    _loadLoans();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadBooks() async {
    setState(() => _loadingBooks = true);
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.libraryBooks,
          queryParameters: _search.isNotEmpty ? {'search': _search} : null);
      final data = res.data;
      setState(() { _books = (data is Map ? data['data'] : data) ?? []; _loadingBooks = false; });
    } catch (_) {
      setState(() => _loadingBooks = false);
    }
  }

  Future<void> _loadLoans() async {
    setState(() => _loadingLoans = true);
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.myLoans);
      final data = res.data;
      setState(() { _loans = (data is Map ? data['data'] : data) ?? []; _loadingLoans = false; });
    } catch (_) {
      setState(() => _loadingLoans = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = context.read<AuthProvider>().isAr;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isAr ? 'المكتبة' : 'Library'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: isAr ? 'الكتب' : 'Books'),
            Tab(text: isAr ? 'إعاراتي' : 'My Loans'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [_booksTab(isAr), _loansTab(isAr)],
      ),
    );
  }

  Widget _booksTab(bool isAr) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(16),
        child: TextField(
          controller: _searchCtrl,
          decoration: InputDecoration(
            hintText: isAr ? 'بحث عن كتاب...' : 'Search books...',
            prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          onChanged: (v) { _search = v; _loadBooks(); },
        ),
      ),
      Expanded(
        child: _loadingBooks
            ? const Padding(padding: EdgeInsets.all(16), child: Column(children: [SkeletonLoader(height: 100), SizedBox(height: 12), SkeletonLoader(height: 100)]))
            : _books.isEmpty
                ? EmptyStateWidget(emoji: '📚', title: isAr ? 'لا توجد كتب' : 'No Books', subtitle: isAr ? 'لا توجد نتائج' : 'No results found')
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.75),
                    itemCount: _books.length,
                    itemBuilder: (ctx, i) {
                      final book = _books[i];
                      final borrowed = (book['_count']?['loans'] ?? 0) as int;
                      final total = (book['totalCopies'] ?? 1) as int;
                      final available = total - borrowed;
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white, borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Container(
                              height: 80,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Center(child: Icon(Icons.menu_book_rounded, color: AppColors.primary, size: 36)),
                            ),
                            const SizedBox(height: 10),
                            Text(book['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary), maxLines: 2, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            if (book['author'] != null)
                              Text(book['author'], style: const TextStyle(color: AppColors.textSecondary, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: available > 0 ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                available > 0 ? '$available ${isAr ? "متاح" : "avail."}' : (isAr ? 'غير متاح' : 'Unavailable'),
                                style: TextStyle(color: available > 0 ? AppColors.success : AppColors.error, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ]),
                        ),
                      );
                    },
                  ),
      ),
    ]);
  }

  Widget _loansTab(bool isAr) {
    if (_loadingLoans) {
      return const Padding(padding: EdgeInsets.all(16), child: Column(children: [SkeletonLoader(height: 80), SizedBox(height: 12), SkeletonLoader(height: 80)]));
    }
    if (_loans.isEmpty) {
      return EmptyStateWidget(emoji: '📖', title: isAr ? 'لا توجد إعارات' : 'No Loans', subtitle: isAr ? 'لم تستعِر أي كتب بعد' : 'You haven\'t borrowed any books yet');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _loans.length,
      itemBuilder: (ctx, i) {
        final loan = _loans[i];
        final dueDate = loan['dueDate'] != null ? DateTime.tryParse(loan['dueDate'].toString()) : null;
        final returned = loan['status']?.toString() == 'RETURNED';
        final overdue = !returned && dueDate != null && dueDate.isBefore(DateTime.now());
        final statusColor = returned ? AppColors.success : overdue ? AppColors.error : AppColors.info;
        final statusLabel = returned ? (isAr ? 'مُرتجع' : 'Returned') : overdue ? (isAr ? 'متأخر' : 'Overdue') : (isAr ? 'نشط' : 'Active');
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              width: 44, height: 44,
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.book_outlined, color: AppColors.primary),
            ),
            title: Text(loan['book']?['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
            subtitle: dueDate != null ? Text('${isAr ? "مستحق:" : "Due:"} ${dueDate.day}/${dueDate.month}/${dueDate.year}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)) : null,
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ),
        );
      },
    );
  }
}
