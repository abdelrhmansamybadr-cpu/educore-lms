import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/school_provider.dart';

/// Wraps a widget and hides it if the school has the module disabled.
/// [module] — module key, e.g. 'FINANCE', 'LIBRARY', 'HR'
/// [child] — shown when module is enabled
/// [fallback] — optional widget shown when module is disabled (default: empty)
class ModuleGate extends StatelessWidget {
  final String module;
  final Widget child;
  final Widget fallback;

  const ModuleGate({
    super.key,
    required this.module,
    required this.child,
    this.fallback = const SizedBox.shrink(),
  });

  @override
  Widget build(BuildContext context) {
    final school = context.watch<SchoolProvider>();
    return school.isModuleEnabled(module) ? child : fallback;
  }
}

/// Returns true if the module is enabled — useful for conditional list building
bool isModuleEnabled(BuildContext context, String module) {
  return context.read<SchoolProvider>().isModuleEnabled(module);
}
