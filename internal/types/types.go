package types

type (
	HealthResp struct {
		Status  string `json:"status"`
		Version string `json:"version"`
	}

	ErrorResp struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}

	JobProfile struct {
		Id              int64        `json:"id"`
		Name            string       `json:"name"`
		Description     string       `json:"description"`
		Company         string       `json:"company"`
		Industry        string       `json:"industry"`
		Location        string       `json:"location"`
		SalaryRange     string       `json:"salaryRange"`
		Skills          []Skill      `json:"skills"`
		Certificates    []string     `json:"certificates"`
		SoftSkills      SoftSkills   `json:"softSkills"`
		GrowthPotential string       `json:"growthPotential"`
		Requirements    Requirements `json:"requirements"`
		CreatedAt       int64        `json:"createdAt"`
		UpdatedAt       int64        `json:"updatedAt"`
	}

	Skill struct {
		Name     string `json:"name"`
		Level    int    `json:"level"`
		Required bool   `json:"required"`
	}

	SoftSkills struct {
		Innovation    int `json:"innovation"`
		Learning      int `json:"learning"`
		Pressure      int `json:"pressure"`
		Communication int `json:"communication"`
		Teamwork      int `json:"teamwork"`
	}

	Requirements struct {
		Education  string `json:"education"`
		Experience string `json:"experience"`
		Internship string `json:"internship"`
	}

	CreateJobReq struct {
		Name         string       `json:"name,optional"`
		Description  string       `json:"description,optional"`
		Company      string       `json:"company,optional"`
		Industry     string       `json:"industry,optional"`
		Location     string       `json:"location,optional"`
		SalaryRange  string       `json:"salaryRange,optional"`
		Skills       []Skill      `json:"skills,optional"`
		Certificates []string     `json:"certificates,optional"`
		SoftSkills   SoftSkills   `json:"softSkills,optional"`
		Requirements Requirements `json:"requirements,optional"`
	}

	UpdateJobReq struct {
		Id           int64        `json:"id"`
		Name         string       `json:"name,optional"`
		Description  string       `json:"description,optional"`
		Company      string       `json:"company,optional"`
		Industry     string       `json:"industry,optional"`
		Location     string       `json:"location,optional"`
		SalaryRange  string       `json:"salaryRange,optional"`
		Skills       []Skill      `json:"skills,optional"`
		Certificates []string     `json:"certificates,optional"`
		SoftSkills   SoftSkills   `json:"softSkills,optional"`
		Requirements Requirements `json:"requirements,optional"`
	}

	JobListReq struct {
		Page     int    `form:"page,default=1"`
		PageSize int    `form:"pageSize,default=10"`
		Industry string `form:"industry,optional"`
		Name     string `form:"name,optional"`
	}

	JobListResp struct {
		Total int64        `json:"total"`
		List  []JobProfile `json:"list"`
	}

	JobGenerateReq struct {
		PositionName string `json:"positionName"`
		Industry     string `json:"industry,optional"`
		RawData      string `json:"rawData,optional"`
	}

	JobResp struct {
		Code int         `json:"code"`
		Msg  string      `json:"msg"`
		Data *JobProfile `json:"data,optional"`
	}

	JobListResultResp struct {
		Code int          `json:"code"`
		Msg  string       `json:"msg"`
		Data *JobListResp `json:"data,optional"`
	}

	JobNode struct {
		Id          int64    `json:"id"`
		Name        string   `json:"name"`
		Level       int      `json:"level"`
		Description string   `json:"description"`
		Skills      []string `json:"skills"`
	}

	PromotionPath struct {
		JobId    int64     `json:"jobId"`
		JobName  string    `json:"jobName"`
		NextJobs []JobNode `json:"nextJobs"`
	}

	TransferPath struct {
		FromJob        JobNode  `json:"fromJob"`
		ToJob          JobNode  `json:"toJob"`
		MatchScore     float64  `json:"matchScore"`
		TransferSkills []string `json:"transferSkills"`
		LearningPath   []string `json:"learningPath"`
	}

	JobGraphReq struct {
		JobId int64 `path:"id"`
	}

	RelatedJobsReq struct {
		JobId int64  `path:"id"`
		Type  string `path:"type,options=[promotion|transfer|related]"`
	}

	TransferPathsResp struct {
		Code int            `json:"code"`
		Msg  string         `json:"msg"`
		Data []TransferPath `json:"data,optional"`
	}

	PromotionPathResp struct {
		Code int            `json:"code"`
		Msg  string         `json:"msg"`
		Data *PromotionPath `json:"data,optional"`
	}

	AllPathsResp struct {
		Code           int             `json:"code"`
		Msg            string          `json:"msg"`
		PromotionPaths []PromotionPath `json:"promotionPaths"`
		TransferPaths  []TransferPath  `json:"transferPaths"`
	}

	StudentProfile struct {
		Id              int64          `json:"id"`
		UserId          int64          `json:"userId"`
		Name            string         `json:"name"`
		Education       string         `json:"education"`
		Major           string         `json:"major"`
		GraduationYear  int            `json:"graduationYear"`
		Skills          []StudentSkill `json:"skills"`
		Certificates    []StudentCert  `json:"certificates"`
		SoftSkills      SoftSkills     `json:"softSkills"`
		Internship      []Internship   `json:"internship"`
		Projects        []Project      `json:"projects"`
		Completeness    float64        `json:"completeness"`
		Competitiveness float64        `json:"competitiveness"`
		CreatedAt       int64          `json:"createdAt"`
		UpdatedAt       int64          `json:"updatedAt"`
	}

	StudentSkill struct {
		Name  string `json:"name"`
		Level int    `json:"level"`
		Years int    `json:"years"`
	}

	StudentCert struct {
		Name  string `json:"name"`
		Level string `json:"level"`
		Year  int    `json:"year"`
	}

	Internship struct {
		Company     string `json:"company"`
		Position    string `json:"position"`
		Duration    int    `json:"duration"`
		Description string `json:"description"`
	}

	Project struct {
		Name         string   `json:"name"`
		Role         string   `json:"role"`
		Description  string   `json:"description"`
		Technologies []string `json:"technologies"`
	}

	CreateStudentReq struct {
		Name           string         `json:"name,optional"`
		Education      string         `json:"education,optional"`
		Major          string         `json:"major,optional"`
		GraduationYear int            `json:"graduationYear,optional"`
		Skills         []StudentSkill `json:"skills,optional"`
		Certificates   []StudentCert  `json:"certificates,optional"`
		SoftSkills     SoftSkills     `json:"softSkills,optional"`
		Internship     []Internship   `json:"internship,optional"`
		Projects       []Project      `json:"projects,optional"`
	}

	UpdateStudentReq struct {
		Id             int64          `json:"id"`
		Name           string         `json:"name,optional"`
		Education      string         `json:"education,optional"`
		Major          string         `json:"major,optional"`
		GraduationYear int            `json:"graduationYear,optional"`
		Skills         []StudentSkill `json:"skills,optional"`
		Certificates   []StudentCert  `json:"certificates,optional"`
		SoftSkills     SoftSkills     `json:"softSkills,optional"`
		Internship     []Internship   `json:"internship,optional"`
		Projects       []Project      `json:"projects,optional"`
	}

	StudentListReq struct {
		Page      int    `form:"page,default=1"`
		PageSize  int    `form:"pageSize,default=10"`
		Major     string `form:"major,optional"`
		Education string `form:"education,optional"`
	}

	StudentListResp struct {
		Total int64            `json:"total"`
		List  []StudentProfile `json:"list"`
	}

	ResumeUploadReq struct {
		FileContent string `json:"fileContent"`
		FileName    string `json:"fileName"`
	}

	StudentResp struct {
		Code int             `json:"code"`
		Msg  string          `json:"msg"`
		Data *StudentProfile `json:"data,optional"`
	}

	StudentListResultResp struct {
		Code int              `json:"code"`
		Msg  string           `json:"msg"`
		Data *StudentListResp `json:"data,optional"`
	}

	GenerateProfileReq struct {
		ResumeContent string `json:"resumeContent"`
	}

	MatchResult struct {
		JobId           int64   `json:"jobId"`
		JobName         string  `json:"jobName"`
		OverallScore    float64 `json:"overallScore"`
		SkillsMatch     float64 `json:"skillsMatch"`
		CertsMatch      float64 `json:"certsMatch"`
		SoftSkillsMatch float64 `json:"softSkillsMatch"`
		ExperienceMatch float64 `json:"experienceMatch"`
		GapAnalysis     []Gap   `json:"gapAnalysis"`
	}

	Gap struct {
		Attribute  string  `json:"attribute"`
		Required   int     `json:"required"`
		Current    int     `json:"current"`
		GapPercent float64 `json:"gapPercent"`
		Suggestion string  `json:"suggestion"`
	}

	MatchReq struct {
		StudentId int64 `json:"studentId"`
		JobId     int64 `json:"jobId"`
	}

	MatchListReq struct {
		StudentId int64   `json:"studentId"`
		Page      int     `form:"page,default=1"`
		PageSize  int     `form:"pageSize,default=10"`
		MinScore  float64 `form:"minScore,optional"`
		Industry  string  `form:"industry,optional"`
	}

	MatchResultResp struct {
		Code int          `json:"code"`
		Msg  string       `json:"msg"`
		Data *MatchResult `json:"data,optional"`
	}

	MatchListResp struct {
		Code  int           `json:"code"`
		Msg   string        `json:"msg"`
		Total int64         `json:"total"`
		List  []MatchResult `json:"list"`
	}

	MatchScoreResp struct {
		Code  int     `json:"code"`
		Msg   string  `json:"msg"`
		Score float64 `json:"score"`
	}

	CareerReport struct {
		Id            int64          `json:"id"`
		StudentId     int64          `json:"studentId"`
		Title         string         `json:"title"`
		Overview      ReportOverview `json:"overview"`
		MatchAnalysis MatchAnalysis  `json:"matchAnalysis"`
		CareerPath    CareerPath     `json:"careerPath"`
		ActionPlan    ActionPlan     `json:"actionPlan"`
		Content       string         `json:"content"`
		Status        string         `json:"status"`
		CreatedAt     int64          `json:"createdAt"`
		UpdatedAt     int64          `json:"updatedAt"`
	}

	ReportOverview struct {
		StudentName     string   `json:"studentName"`
		Education       string   `json:"education"`
		Major           string   `json:"major"`
		Completeness    float64  `json:"completeness"`
		Competitiveness float64  `json:"competitiveness"`
		TopJobs         []JobRef `json:"topJobs"`
	}

	JobRef struct {
		Id   int64  `json:"id"`
		Name string `json:"name"`
	}

	MatchAnalysis struct {
		OverallScore float64       `json:"overallScore"`
		Strengths    []string      `json:"strengths"`
		Weaknesses   []string      `json:"weaknesses"`
		TopMatches   []MatchResult `json:"topMatches"`
	}

	CareerPath struct {
		TargetJob     JobNode     `json:"targetJob"`
		IndustryTrend string      `json:"industryTrend"`
		SocialDemand  string      `json:"socialDemand"`
		Milestones    []Milestone `json:"milestones"`
	}

	Milestone struct {
		Stage    string   `json:"stage"`
		Year     int      `json:"year"`
		Position string   `json:"position"`
		Skills   []string `json:"skills"`
		Salary   string   `json:"salary"`
	}

	ActionPlan struct {
		ShortTerm []Action `json:"shortTerm"`
		MidTerm   []Action `json:"midTerm"`
		LongTerm  []Action `json:"longTerm"`
	}

	Action struct {
		Period    string   `json:"period"`
		Task      string   `json:"task"`
		Details   string   `json:"details"`
		Timeline  string   `json:"timeline"`
		Resources []string `json:"resources"`
	}

	GenerateReportReq struct {
		StudentId   int64         `json:"studentId"`
		TargetJobId int64         `json:"targetJobId,optional"`
		Options     ReportOptions `json:"options,optional"`
	}

	ReportOptions struct {
		IncludeGapAnalysis bool `json:"includeGapAnalysis"`
		IncludeActionPlan  bool `json:"includeActionPlan"`
		DetailedLevel      int  `json:"detailedLevel"`
	}

	UpdateReportReq struct {
		Id      int64  `json:"id"`
		Title   string `json:"title,optional"`
		Content string `json:"content,optional"`
		Status  string `json:"status,optional"`
	}

	ReportListReq struct {
		Page      int    `form:"page,default=1"`
		PageSize  int    `form:"pageSize,default=10"`
		StudentId int64  `form:"studentId,optional"`
		Status    string `form:"status,optional"`
	}

	ReportListResp struct {
		Total int64          `json:"total"`
		List  []CareerReport `json:"list"`
	}

	ReportResp struct {
		Code int           `json:"code"`
		Msg  string        `json:"msg"`
		Data *CareerReport `json:"data,optional"`
	}

	ReportListResultResp struct {
		Code int             `json:"code"`
		Msg  string          `json:"msg"`
		Data *ReportListResp `json:"data,optional"`
	}

	ExportReq struct {
		ReportId int64  `json:"reportId"`
		Format   string `json:"format,options=[pdf|docx|json]"`
	}

	ExportResp struct {
		Code    int    `json:"code"`
		Msg     string `json:"msg"`
		Url     string `json:"url"`
		Content string `json:"content,optional"`
	}

	PolishReq struct {
		ReportId int64  `json:"reportId"`
		Level    string `json:"level,options=[light|normal|thorough]"`
	}

	RegisterReq struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
		Phone    string `json:"phone,optional"`
	}

	LoginReq struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	LoginResp struct {
		Token   string `json:"token"`
		Expires int64  `json:"expires"`
		UserId  int64  `json:"userId"`
	}

	UserInfo struct {
		Id        int64  `json:"id"`
		Username  string `json:"username"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Role      string `json:"role"`
		CreatedAt int64  `json:"createdAt"`
	}

	UpdateUserReq struct {
		Email string `json:"email,optional"`
		Phone string `json:"phone,optional"`
	}

	UserResp struct {
		Code int       `json:"code"`
		Msg  string    `json:"msg"`
		Data *UserInfo `json:"data,optional"`
	}
)
