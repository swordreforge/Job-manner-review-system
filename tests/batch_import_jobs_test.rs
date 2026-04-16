#[cfg(test)]
mod batch_import_jobs_tests {
    use calamine::Data;
    use teacher_api::handlers::job::parse_job_row_from_vec;
    use teacher_api::models::CreateJobRequest;

    #[test]
    fn test_parse_job_row_success() {
        let row = vec![
            Data::String("测试岗位".to_string()),
            Data::String("测试描述".to_string()),
            Data::String("测试公司".to_string()),
            Data::String("技术".to_string()),
            Data::String("开发".to_string()),
            Data::String("北京".to_string()),
            Data::String("10000-20000".to_string()),
            Data::String("Rust,Go".to_string()),
            Data::String("无".to_string()),
            Data::String("团队协作".to_string()),
            Data::String("1年经验".to_string()),
            Data::String("高".to_string()),
        ];

        let result = parse_job_row_from_vec(&row);
        assert!(result.is_ok());

        let job_request = result.unwrap();
        assert_eq!(job_request.name, "测试岗位");
        assert_eq!(job_request.company, Some("测试公司".to_string()));
        assert_eq!(job_request.industry, Some("技术".to_string()));
    }

    #[test]
    fn test_parse_job_row_missing_name() {
        let row = vec![
            Data::Empty,
            Data::String("测试描述".to_string()),
            Data::String("测试公司".to_string()),
            Data::String("技术".to_string()),
            Data::String("开发".to_string()),
            Data::String("北京".to_string()),
            Data::String("10000-20000".to_string()),
            Data::String("Rust,Go".to_string()),
            Data::String("无".to_string()),
            Data::String("团队协作".to_string()),
            Data::String("1年经验".to_string()),
            Data::String("高".to_string()),
        ];

        let result = parse_job_row_from_vec(&row);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "岗位名称不能为空");
    }

    #[test]
    fn test_parse_job_row_insufficient_columns() {
        let row = vec![
            Data::String("测试岗位".to_string()),
            Data::String("测试描述".to_string()),
        ];

        let result = parse_job_row_from_vec(&row);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "列数不足，需要12列");
    }

    #[test]
    fn test_parse_job_row_with_empty_cells() {
        let row = vec![
            Data::String("测试岗位".to_string()),
            Data::Empty,
            Data::Empty,
            Data::String("技术".to_string()),
            Data::Empty,
            Data::String("北京".to_string()),
            Data::Empty,
            Data::String("Rust".to_string()),
            Data::Empty,
            Data::Empty,
            Data::Empty,
            Data::String("高".to_string()),
        ];

        let result = parse_job_row_from_vec(&row);
        assert!(result.is_ok());

        let job_request = result.unwrap();
        assert_eq!(job_request.name, "测试岗位");
        assert_eq!(job_request.description, None);
        assert_eq!(job_request.company, None);
        assert_eq!(job_request.industry, Some("技术".to_string()));
    }

    #[test]
    fn test_parse_job_row_with_numeric_values() {
        let row = vec![
            Data::String("测试岗位".to_string()),
            Data::String("描述".to_string()),
            Data::String("公司".to_string()),
            Data::Int(1),
            Data::Float(2.5),
            Data::String("地点".to_string()),
            Data::String("薪资".to_string()),
            Data::String("技能".to_string()),
            Data::String("证书".to_string()),
            Data::String("软技能".to_string()),
            Data::String("要求".to_string()),
            Data::String("潜力".to_string()),
        ];

        let result = parse_job_row_from_vec(&row);
        assert!(result.is_ok());

        let job_request = result.unwrap();
        assert_eq!(job_request.name, "测试岗位");
        assert_eq!(job_request.industry, Some("1".to_string()));
        assert_eq!(job_request.category, Some("2.5".to_string()));
    }
}