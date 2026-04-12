// 数据模型模块

pub mod job;
pub mod student;
pub mod user;

pub use job::{CreateJobRequest, Job, JobQuery, JobResponse, UpdateJobRequest};
pub use student::{
    CreateStudentRequest, Student, StudentQuery, StudentResponse, UpdateStudentRequest,
};
pub use user::{
    Claims, CreateMySqlUserRequest, CreateUserRequest, LoginRequest, LoginResponse, MySqlUser,
    MySqlUserResponse, TokenInfo, UpdateMySqlUserRequest, User, UserResponse,
};
