export interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }
export interface Employee { id: number; keycloakId: string; firstName: string; lastName: string; email: string; phone: string; hireDate: string; position: string; roleId: number; departmentId: number; }
export interface CreateEmployeeRequest { firstName: string; lastName: string; email: string; password: string; phone: string; hireDate: string; position: string; roleId: number; departmentId: number; }
export interface Department { id: number; name: string; description: string; }
export interface EmployeeRole { id: number; name: string; description: string; }
export interface Candidate { id: number; keycloakId: string; firstName: string; lastName: string; email: string; phone?: string; location?: string; available?: boolean; linkedinUrl?: string; githubUrl?: string; }
export type ApplicationStatus = 'SUBMITTED' | 'CV_REVISION_REQUIRED' | 'UNDER_AI_REVIEW' | 'HR_INTERVIEW' | 'TECHNICAL_INTERVIEW' | 'MANAGER_INTERVIEW' | 'REJECTED' | 'HIRED' | 'CLOSED';
export type ApplicationStep = 'CREATED' | 'CV_UPLOADED' | 'COMPLETED';
export interface Application { id: number; candidateId: number; jobOfferId: number; cvId?: number; status: ApplicationStatus; currentStep?: ApplicationStep; processInstanceId?: string; currentTaskId?: string; currentTaskDefinitionKey?: string; currentTaskName?: string; matchingScore?: number; appliedAt?: string; updatedAt?: string; }
export interface WorkflowTask { taskId: string; taskDefinitionKey: string; taskName: string; processInstanceId: string; processDefinitionId: string; assignee?: string; createdAt?: string; }
export interface ApplicationUpdate { status: ApplicationStatus; currentStep?: ApplicationStep; matchingScore?: number | null; }
export interface ApplicationDashboardCounts { total: number; pending: number; hired: number; rejected: number; }
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
export type EmploymentType = 'CDI' | 'CDD' | 'INTERNSHIP' | 'FREELANCE' | 'PART_TIME' | 'FULL_TIME';
export type ExperienceLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
export interface JobRequirement { id?: number; requirement: string; }
export interface JobSkill { id?: number; skillName: string; mandatory: boolean; }
export interface JobOffer { id?: number; title: string; domain?: string; description: string; location: string; employmentType: EmploymentType; experienceLevel: ExperienceLevel; openingDate: string; closingDate: string; status: JobStatus; requirements: JobRequirement[]; skills: JobSkill[]; }
export type InterviewType = 'ONLINE' | 'ONSITE' | 'PHONE';
export type InterviewStage = 'HR_INTERVIEW' | 'TECHNICAL_INTERVIEW' | 'MANAGER_INTERVIEW';
export type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export interface Interview { id?: number; applicationId: number; interviewerId: number; scheduledAt: string; duration: number; type: InterviewType; stage?: InterviewStage; status?: InterviewStatus; meetingLink?: string; location?: string; notes?: string; feedback?: string; approved?: boolean; result?: 'PASSED' | 'FAILED' | 'PENDING'; }
export interface CvFile { id: number; fileName: string; fileType: string; active: boolean; uploadedAt?: string; }
export type CandidateNotificationType = 'REJECTION' | 'WELCOME' | 'OFFER_ACCEPTED' | 'CV_TIMEOUT' | 'CV_REVISION_REQUIRED' | 'APPLICATION_RECEIVED' | 'APPLICATION_UPDATED' | 'INTERVIEW_SCHEDULED';
export interface CandidateNotification { id: number; applicationId?: number; type: CandidateNotificationType; subject: string; message: string; status: 'PENDING' | 'SIMULATED' | 'SENT' | 'FAILED' | 'DELIVERED' | 'EMAIL_FAILED'; channel: 'EMAIL' | 'LOG' | 'IN_APP' | 'IN_APP_EMAIL'; createdAt: string; readAt?: string; }
export interface CvRecommendation { score: number; decision: 'REJECTED' | 'REVIEW' | 'RECOMMENDED'; summary: string; matchedSkills: string[]; missingMandatorySkills: string[]; strengths: string[]; weaknesses: string[]; evidence: string[]; confidence: number; }
export type HrAssistantScope = 'APPLICATIONS' | 'CANDIDATES' | 'JOB_OFFERS';
export interface HrAssistantResponse { answer: string; filterApplied: boolean; matchingIds: number[]; followUpQuestions: string[]; }
