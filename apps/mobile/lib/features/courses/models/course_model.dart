class CourseModel {
  final String id;
  final String title;
  final String? titleAr;
  final String? description;
  final String? descriptionAr;
  final String? coverImage;
  final String? teacherName;
  final String? teacherId;
  final int? lessonsCount;
  final int? studentsCount;
  final double? progress;
  final String? subject;
  final String? grade;
  final bool? isEnrolled;
  final List<LessonModel>? lessons;

  CourseModel({
    required this.id,
    required this.title,
    this.titleAr,
    this.description,
    this.descriptionAr,
    this.coverImage,
    this.teacherName,
    this.teacherId,
    this.lessonsCount,
    this.studentsCount,
    this.progress,
    this.subject,
    this.grade,
    this.isEnrolled,
    this.lessons,
  });

  String displayTitle(bool isAr) => isAr && titleAr != null ? titleAr! : title;
  String? displayDescription(bool isAr) =>
      isAr && descriptionAr != null ? descriptionAr : description;

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      titleAr: json['titleAr'] ?? json['title_ar'],
      description: json['description'],
      descriptionAr: json['descriptionAr'] ?? json['description_ar'],
      coverImage: json['coverImage'] ?? json['cover_image'] ?? json['thumbnail'],
      teacherName: json['teacherName'] ??
          json['teacher_name'] ??
          (json['teacher'] is Map
              ? '${json['teacher']['firstName'] ?? ''} ${json['teacher']['lastName'] ?? ''}'.trim()
              : null),
      teacherId: json['teacherId']?.toString() ?? json['teacher_id']?.toString(),
      lessonsCount: json['lessonsCount'] ?? json['lessons_count'],
      studentsCount: json['studentsCount'] ?? json['students_count'],
      progress: (json['progress'] ?? 0).toDouble(),
      subject: json['subject'],
      grade: json['grade'],
      isEnrolled: json['isEnrolled'] ?? json['is_enrolled'],
      lessons: json['lessons'] is List
          ? (json['lessons'] as List).map((l) => LessonModel.fromJson(l)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'titleAr': titleAr,
        'description': description,
        'coverImage': coverImage,
        'teacherName': teacherName,
        'lessonsCount': lessonsCount,
        'studentsCount': studentsCount,
        'progress': progress,
        'subject': subject,
        'grade': grade,
      };
}

class LessonModel {
  final String id;
  final String title;
  final String? titleAr;
  final String? description;
  final int order;
  final String? type;
  final bool? isCompleted;
  final int? duration;

  LessonModel({
    required this.id,
    required this.title,
    this.titleAr,
    this.description,
    required this.order,
    this.type,
    this.isCompleted,
    this.duration,
  });

  String displayTitle(bool isAr) => isAr && titleAr != null ? titleAr! : title;

  factory LessonModel.fromJson(Map<String, dynamic> json) {
    return LessonModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      titleAr: json['titleAr'] ?? json['title_ar'],
      description: json['description'],
      order: json['order'] ?? 0,
      type: json['type'],
      isCompleted: json['isCompleted'] ?? json['is_completed'],
      duration: json['duration'],
    );
  }
}
