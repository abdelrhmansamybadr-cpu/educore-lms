class UserModel {
  final String id;
  final String email;
  final String role;
  final String firstName;
  final String lastName;
  final String? firstNameAr;
  final String? lastNameAr;
  final String? avatar;
  final String? schoolId;
  final String? phone;
  final String? bio;
  final Map<String, dynamic>? profile;

  UserModel({
    required this.id,
    required this.email,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.firstNameAr,
    this.lastNameAr,
    this.avatar,
    this.schoolId,
    this.phone,
    this.bio,
    this.profile,
  });

  String get fullName => '$firstName $lastName';
  String get fullNameAr => '${firstNameAr ?? firstName} ${lastNameAr ?? lastName}';

  String displayName(bool isAr) {
    if (isAr && (firstNameAr != null || lastNameAr != null)) {
      return fullNameAr;
    }
    return fullName;
  }

  bool get isStudent => role.toUpperCase() == 'STUDENT';
  bool get isTeacher => ['TEACHER', 'SUB_TEACHER', 'DEPARTMENT_HEAD'].contains(role.toUpperCase());
  bool get isParent => role.toUpperCase() == 'PARENT';
  bool get isAdmin => ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR'].contains(role.toUpperCase());

  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Profile data may be nested under 'profile' key
    final p = json['profile'] is Map ? Map<String, dynamic>.from(json['profile']) : null;
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'STUDENT',
      firstName: json['firstName'] ?? json['first_name'] ?? p?['firstName'] ?? p?['first_name'] ?? '',
      lastName: json['lastName'] ?? json['last_name'] ?? p?['lastName'] ?? p?['last_name'] ?? '',
      firstNameAr: json['firstNameAr'] ?? json['first_name_ar'] ?? p?['firstNameAr'] ?? p?['first_name_ar'],
      lastNameAr: json['lastNameAr'] ?? json['last_name_ar'] ?? p?['lastNameAr'] ?? p?['last_name_ar'],
      avatar: json['avatar'] ?? p?['avatar'],
      schoolId: json['schoolId']?.toString() ?? json['school_id']?.toString(),
      phone: json['phone'] ?? p?['phone'],
      bio: json['bio'] ?? p?['bio'],
      profile: p,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'firstName': firstName,
      'lastName': lastName,
      'firstNameAr': firstNameAr,
      'lastNameAr': lastNameAr,
      'avatar': avatar,
      'schoolId': schoolId,
      'phone': phone,
      'bio': bio,
      'profile': profile,
    };
  }

  UserModel copyWith({
    String? firstName,
    String? lastName,
    String? firstNameAr,
    String? lastNameAr,
    String? avatar,
    String? phone,
    String? bio,
  }) {
    return UserModel(
      id: id,
      email: email,
      role: role,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      firstNameAr: firstNameAr ?? this.firstNameAr,
      lastNameAr: lastNameAr ?? this.lastNameAr,
      avatar: avatar ?? this.avatar,
      schoolId: schoolId,
      phone: phone ?? this.phone,
      bio: bio ?? this.bio,
      profile: profile,
    );
  }
}
