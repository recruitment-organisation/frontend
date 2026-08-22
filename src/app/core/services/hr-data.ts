import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../enviroment/enviroment';
import { Application, ApplicationDashboardCounts, Candidate, CandidateNotification, CreateEmployeeRequest, CvFile, CvRecommendation, Department, Employee, EmployeeRole, HrAssistantResponse, HrAssistantScope, Interview, InterviewStatus, JobOffer, PageResponse, WorkflowTask } from '../models/hr';

@Injectable({ providedIn: 'root' })
export class HrData {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private pageParams = (page = 0, size = 20, sort?: string) => {
    let params = new HttpParams().set('page', page).set('size', size);
    return sort ? params.set('sort', sort) : params;
  };

  employees(page = 0, size = 20) { return this.http.get<PageResponse<Employee>>(`${this.base}employee-service/employee/getall`, { params: this.pageParams(page, size) }); }
  employee(id: number) { return this.http.get<Employee>(`${this.base}employee-service/employee/get/${id}`); }
  currentEmployee() { return this.http.get<Employee>(`${this.base}employee-service/employee/me`); }
  departments(page = 0, size = 100) { return this.http.get<PageResponse<Department>>(`${this.base}employee-service/department/getall`, { params: this.pageParams(page, size) }); }
  createDepartment(department: Pick<Department, 'name' | 'description'>) { return this.http.post<Department>(`${this.base}employee-service/department/create`, department); }
  updateDepartment(department: Department) { return this.http.put<Department>(`${this.base}employee-service/department/update`, department); }
  deleteDepartment(id: number) { return this.http.delete<void>(`${this.base}employee-service/department/delete/${id}`); }
  createEmployee(employee: CreateEmployeeRequest) { return this.http.post(`${this.base}auth-service/auth/create-employee`, employee); }
  deleteEmployee(id: number) { return this.http.delete<void>(`${this.base}employee-service/employee/delete/${id}`); }
  roles(page = 0, size = 100) { return this.http.get<PageResponse<EmployeeRole>>(`${this.base}employee-service/employee-role/getall`, { params: this.pageParams(page, size) }); }
  candidates(page = 0, size = 20) { return this.http.get<PageResponse<Candidate>>(`${this.base}candidate-service/candidate/get-all`, { params: this.pageParams(page, size) }); }
  deleteCandidate(id: number) { return this.http.delete<void>(`${this.base}candidate-service/candidate/delete/${id}`); }
  candidate(id: number) { return this.http.get<Candidate>(`${this.base}candidate-service/candidate/get/${id}`); }
  applications(page = 0, size = 50, sort = 'appliedAt,desc') { return this.http.get<PageResponse<Application>>(`${this.base}application-service/applications/getall`, { params: this.pageParams(page, size, sort) }); }
  application(id: number) { return this.http.get<Application>(`${this.base}application-service/applications/get/${id}`); }
  deleteApplication(id: number) { return this.http.delete<void>(`${this.base}application-service/applications/delete/${id}`); }
  markHrInterviewScheduled(id: number) { return this.http.patch<Application>(`${this.base}application-service/applications/${id}/hr-interview-scheduled`, {}); }
  completeWorkflowTask(taskId: string, variables: Record<string, unknown>) { return this.http.post<void>(`${this.base}workflow-service/workflow-tasks/complete`, { taskId, variables }); }
  workflowTasksByProcess(processInstanceId: string) { return this.http.get<WorkflowTask[]>(`${this.base}workflow-service/workflow-tasks/process/${processInstanceId}`); }
  notifyCandidate(candidate: Candidate, applicationId: number, type: 'APPLICATION_UPDATED' | 'INTERVIEW_SCHEDULED', subject: string, message: string) { return this.http.post(`${this.base}notification-service/api/notifications/send`, { candidateId: candidate.id, candidateKeycloakId: candidate.keycloakId, applicationId, recipientEmail: candidate.email, type, subject, message }); }
  notifications(page = 0, size = 20) { return this.http.get<PageResponse<CandidateNotification>>(`${this.base}notification-service/api/notifications/mine`, { params: this.pageParams(page, size) }); }
  applicationsByStatus(status: Application['status'], page = 0, size = 50, sort = 'appliedAt,desc') { return this.http.get<PageResponse<Application>>(`${this.base}application-service/applications/get-by-status/${status}`, { params: this.pageParams(page, size, sort) }); }
  applicationDashboardCounts() { return this.http.get<ApplicationDashboardCounts>(`${this.base}application-service/applications/dashboard-counts`); }
  analyzeApplication(id: number) { return this.http.post<CvRecommendation>(`${this.base}rag-service/rag/hr/applications/${id}/recommendation`, {}); }
  askAssistant(question: string, scope: HrAssistantScope, page = 0, size = 20) { return this.http.post<HrAssistantResponse>(`${this.base}rag-service/rag/hr/assistant/ask`, { question, scope, page, size }); }
  offers(page = 0, size = 20) { return this.http.get<PageResponse<JobOffer>>(`${this.base}job-offer-service/job-offers/getall`, { params: this.pageParams(page, size) }); }
  offer(id: number) { return this.http.get<JobOffer>(`${this.base}job-offer-service/job-offers/get/${id}`); }
  offersByStatus(status: JobOffer['status'], page = 0, size = 50) { return this.http.get<PageResponse<JobOffer>>(`${this.base}job-offer-service/job-offers/status/${status}`, { params: this.pageParams(page, size) }); }
  createOffer(offer: JobOffer) { return this.http.post<JobOffer>(`${this.base}job-offer-service/job-offers/create`, offer); }
  updateOffer(id: number, offer: JobOffer) { return this.http.put<JobOffer>(`${this.base}job-offer-service/job-offers/update/${id}`, offer); }
  interviews(page = 0, size = 50) { return this.http.get<PageResponse<Interview>>(`${this.base}interview-service/interviews`, { params: this.pageParams(page, size) }); }
  interview(id: number) { return this.http.get<Interview>(`${this.base}interview-service/interviews/${id}`); }
  interviewsByApplication(applicationId: number, page = 0, size = 50) { return this.http.get<PageResponse<Interview>>(`${this.base}interview-service/interviews/application/${applicationId}`, { params: this.pageParams(page, size) }); }
  interviewsByInterviewer(interviewerId: number, page = 0, size = 50) { return this.http.get<PageResponse<Interview>>(`${this.base}interview-service/interviews/interviewer/${interviewerId}`, { params: this.pageParams(page, size) }); }
  interviewsByStatus(status: InterviewStatus, page = 0, size = 50) { return this.http.get<PageResponse<Interview>>(`${this.base}interview-service/interviews/status/${status}`, { params: this.pageParams(page, size) }); }
  createInterview(interview: Interview) { return this.http.post<Interview>(`${this.base}interview-service/interviews`, interview); }
  updateInterview(id: number, interview: Interview) { return this.http.put<Interview>(`${this.base}interview-service/interviews/${id}`, interview); }
  updateInterviewStatus(id: number, status: Interview['status']) { return this.http.patch<Interview>(`${this.base}interview-service/interviews/${id}/status`, null, { params: new HttpParams().set('status', status ?? 'CANCELLED') }); }
  addInterviewFeedback(id: number, feedback: string, notes: string, result: NonNullable<Interview['result']>, hiring?: { departmentId: number; employeeRoleId: number; position: string }) {
    let params = new HttpParams().set('feedback', feedback).set('notes', notes).set('result', result);
    if (hiring) {
      params = params
        .set('departmentId', hiring.departmentId)
        .set('employeeRoleId', hiring.employeeRoleId)
        .set('position', hiring.position);
    }
    return this.http.patch<Interview>(`${this.base}interview-service/interviews/${id}/feedback`, null, { params });
  }
  cv(id: number) { return this.http.get<CvFile>(`${this.base}application-service/cv/get/${id}`); }
  downloadCv(id: number) { return this.http.get(`${this.base}application-service/cv/download/${id}`, { responseType: 'blob' }); }
}
