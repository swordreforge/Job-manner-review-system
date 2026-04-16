// 数据模型模块

pub mod job;
pub mod school;
pub mod student;
pub mod user;

pub use job::{CreateJobRequest, Job, JobQuery, JobResponse, UpdateJobRequest};
pub use school::{CreateSchoolRequest, School, SchoolQuery, SchoolResponse, UpdateSchoolRequest};
pub use student::{
    CreateStudentRequest, Student, StudentQuery, StudentResponse, UpdateStudentRequest,
};
pub use user::{
    ChangePasswordRequest, ChangeUsernameRequest, Claims, CreateMySqlUserRequest,
    CreateUserRequest, LoginRequest, LoginResponse, MySqlUser, MySqlUserResponse, TokenInfo,
    UpdateMySqlUserRequest, User, UserResponse,
};
