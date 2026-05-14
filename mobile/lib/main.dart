import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/providers/school_provider.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const EduCoreApp());
}

class EduCoreApp extends StatefulWidget {
  const EduCoreApp({super.key});

  @override
  State<EduCoreApp> createState() => _EduCoreAppState();
}

class _EduCoreAppState extends State<EduCoreApp> {
  late final AuthProvider _authProvider;
  late final SchoolProvider _schoolProvider;
  late final AppRouter _appRouter;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _schoolProvider = SchoolProvider();
    _appRouter = AppRouter(_authProvider);

    // Load school config whenever auth state changes to authenticated
    _authProvider.addListener(() {
      if (_authProvider.isAuthenticated) {
        _schoolProvider.load();
      } else {
        _schoolProvider.reset();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _schoolProvider),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final isAr = auth.locale == 'ar';
          return MaterialApp.router(
            title: 'EduCore LMS',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            locale: Locale(auth.locale),
            supportedLocales: const [Locale('en'), Locale('ar')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            builder: (context, child) {
              return Directionality(
                textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
                child: child!,
              );
            },
            routerConfig: _appRouter.router,
          );
        },
      ),
    );
  }
}
