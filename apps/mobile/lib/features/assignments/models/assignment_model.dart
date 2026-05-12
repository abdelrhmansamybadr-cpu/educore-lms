class AssignmentModel {
  final String id;
  final String title;
  final String? description;
  final DateTime? dueDate;
  final String? status;
  final double? score;
  final double? maxScore;
  final String? courseId;
  final String? courseName;
  final int? submissionsCount;
  final int? totalStudents;
  final String? submittedAt;
  final String? feedback;

  AssignmentModel({
    required this.id,
    required this.title,
    this.description,
    this.dueDate,
    this.status,
    this.score,
    this.maxScore,
    this.courseId,
    this.courseName,
    this.submissionsCount,
    this.totalStudents,
    this.submittedAt,
    this.feedback,
  });

  bool get isPending => status == 'pending' || status == null;
  bool get isSubmitted => status == 'submitted';
  bool get isGraded => status == 'graded';
  bool get isLate =>
      dueDate != null && DateTime.now().isAfter(dueDate!) && !isSubmitted && !isGraded;

  factory AssignmentModel.fromJson(Map<String, dynamic> json) {
    DateTime? dueDate;
    if (json['dueDate'] != null) {
      dueDate = DateTime.tryParse(json['dueDate'].toString());
    } else if (json['due_date'] != null) {
      dueDate = DateTime.tryParse(json['due_date'].toString());
    }

    return AssignmentModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      dueDate: dueDate,
      status: json['status'] ?? json['submissionStatus'],
      score: json['score'] != null ? (json['score']).toDouble() : null,
      maxScore: json['maxPoints'] != null
          ? (json['maxPoints']).toDouble()
          : json['maxScore'] != null
              ? (json['maxScore']).toDouble()
              : json['max_score'] != null
                  ? (json['max_score']).toDouble()
                  : 100.0,
      courseId: json['courseId']?.toString() ?? json['course_id']?.toString(),
      courseName: json['courseName'] ??
          json['course_name'] ??
          (json['course'] is Map ? json['course']['title'] : null),
      submissionsCount: json['submissionsCount'] ?? json['submissions_count'],
      totalStudents: json['totalStudents'] ?? json['total_students'],
      submittedAt: json['submittedAt'] ?? json['submitted_at'],
      feedback: json['feedback'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'dueDate': dueDate?.toIso8601String(),
        'status': status,
        'score': score,
        'maxScore': maxScore,
        'courseId': courseId,
        'courseName': courseName,
      };
}
