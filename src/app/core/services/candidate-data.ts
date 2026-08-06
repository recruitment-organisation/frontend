import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../enviroment/enviroment';
import { Application, Candidate, CandidateNotification, JobOffer, PageResponse, WorkflowTask } from '../models/hr';

@Injectable({ providedIn: 'root' })
export class CandidateData {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  me(): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.base}candidate-service/candidate/me`);
  }

  openOffers(page = 0, size = 20): Observable<PageResponse<JobOffer>> {
    return this.http.get<PageResponse<JobOffer>>(`${this.base}job-offer-service/job-offers/status/OPEN`, {
      params: { page, size }
    });
  }

  applications(page = 0, size = 20): Observable<PageResponse<Application>> {
    return this.http.get<PageResponse<Application>>(`${this.base}application-service/applications/mine`, { params: { page, size } });
  }

  workflowTask(taskId: string): Observable<WorkflowTask> {
    return this.http.get<WorkflowTask>(`${this.base}workflow-service/workflow-tasks/${taskId}`);
  }

  notifications(page = 0, size = 20): Observable<PageResponse<CandidateNotification>> {
    return this.http.get<PageResponse<CandidateNotification>>(`${this.base}notification-service/api/notifications/mine`, { params: { page, size } });
  }

  markNotificationAsRead(notificationId: number): Observable<CandidateNotification> {
    return this.http.patch<CandidateNotification>(`${this.base}notification-service/api/notifications/${notificationId}/read`, {});
  }

  applyToOffer(jobOfferId: number, cv: File): Observable<Application> {
    return this.me().pipe(
      switchMap(candidate => this.http.post<Application>(`${this.base}application-service/applications/create`, { candidateId: candidate.id, jobOfferId })),
      switchMap(application => this.uploadCv(application.id, cv).pipe(
        switchMap(() => this.http.post<Application>(`${this.base}application-service/applications/${application.id}/submit`, {}))
      ))
    );
  }

  replaceCv(application: Application, file: File): Observable<void> {
    return this.uploadCv(application.id, file).pipe(
      switchMap(() => this.isCvRevisionTask(application) && application.currentTaskId
        ? this.http.post<void>(`${this.base}workflow-service/workflow-tasks/complete`, { taskId: application.currentTaskId, variables: { newCvFile: file.name } })
        : of(undefined)
      )
    );
  }

  private uploadCv(applicationId: number, file: File): Observable<unknown> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post(`${this.base}application-service/cv/applications/${applicationId}/cv`, data);
  }

  private isCvRevisionTask(application: Application): boolean {
    return application.currentTaskDefinitionKey === 'sid-3140788F-868D-4F20-88A1-D66AF0BA345A'
      || application.currentTaskName?.toLocaleLowerCase().includes('revise cv') === true;
  }
}
