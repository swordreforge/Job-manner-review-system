#[cfg(test)]
mod batch_import_students_tests {
    use calamine::Data;
    use teacher_api::handlers::student::parse_student_row_from_vec;
    use teacher_api::models::CreateStudentRequest;

    #[test]
    fn test_parse_student_row_success() {
        let row = vec![
            Data::String("测试学生".to_string()),
            Data::String("本科".to_string()),
            Data::String("计算机".to_string()),
            Data::Int(2024),
            Data::String("Python,Rust".to_string()),
            Data::String("无".to_string()),
            Data::String("团队协作".to_string()),
            Data::String("字节跳动实习".to_string()),
            Data::String("电商开发".to_string()),
            Data::String("备注".to_string()),
        ];

        let result = parse_student_row_from_vec(&row);
        assert!(result.is_ok());

        let student_request = result.unwrap();
        assert_eq!(student_request.name, "测试学生");
        assert_eq!(student_request.education, Some("本科".to_string()));
        assert_eq!(student_request.major, Some("计算机".to_string()));
        assert_eq!(student_request.graduation_year, Some(2024));
    }

    #[test]
    fn test_parse_student_row_missing_name() {
        let row = vec![
            Data::Empty,
            Data::String("本科".to_string()),
            Data::String("计算机".to_string()),
            Data::Int(2024),
            Data::String("Python".to_string()),
            Data::String("无".to_string()),
            Data::String("团队协作".to_string()),
            Data::String("实习".to_string()),
            Data::String("项目".to_string()),
            Data::String("备注".to_string()),
        ];

        let result = parse_student_row_from_vec(&row);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "学生姓名不能为空");
    }

    #[test]
    fn test_parse_student_row_insufficient_columns() {
        let row = vec![
            Data::String("测试学生".to_string()),
            Data::String("本科".to_string()),
        ];

        let result = parse_student_row_from_vec(&row);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "列数不足，需要10列");
    }

    #[test]
    fn test_parse_student_row_with_empty_cells() {
        let row = vec![
            Data::String("测试学生".to_string()),
            Data::Empty,
            Data::Empty,
            Data::Empty,
            Data::String("Rust".to_string()),
            Data::Empty,
            Data::Empty,
            Data::Empty,
            Data::Empty,
            Data::Empty,
        ];

        let result = parse_student_row_from_vec(&row);
        assert!(result.is_ok());

        let student_request = result.unwrap();
        assert_eq!(student_request.name, "测试学生");
        assert_eq!(student_request.education, None);
        assert_eq!(student_request.major, None);
        assert_eq!(student_request.graduation_year, None);
        assert_eq!(student_request.skills, Some("Rust".to_string()));
    }

    #[test]
    fn test_parse_student_row_with_graduation_year_as_string() {
        let row = vec![
            Data::String("测试学生".to_string()),
            Data::String("本科".to_string()),
            Data::String("计算机".to_string()),
            Data::String("2024"),
            Data::String("Python".to_string()),
            Data::String("无".to_string()),
            Data::String("团队协作".to_string()),
            Data::String("实习".to_string()),
            Data::String("项目".to_string()),
            Data::String("备注".to_string()),
        ];

        let result = parse_student_row_from_vec(&row);
        assert!(result.is_ok());

        let student_request = result.unwrap();
        assert_eq!(student_request.name, "测试学生");
        assert_eq!(student_request.graduation_year, Some(2024));
    }

    #[test]
    fn test_parse_student_row_with_float_graduation_year() {
        let row = vec![
            Data::String("测试学生".to_string()),
            Data::String("本科".to_string()),
            Data::String("计算机".to_string()),
            Data::Float(2024.0),
            Data::String("Python".to_string()),
            Data::String("无".to_string()),
            Data::String("团队协作".to_string()),
            Data::String("实习".to_string()),
            Data::String("项目".to_string()),
            Data::String("备注".to_string()),
        ];

        let result = parse_student_row_from_vec(&row);
        assert!(result.is_ok());

        let student_request = result.unwrap();
        assert_eq!(student_request.name, "测试学生");
        assert_eq!(student_request.graduation_year, Some(2024));
    }
}