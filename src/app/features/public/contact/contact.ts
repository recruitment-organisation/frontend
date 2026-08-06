import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({ selector: 'app-contact', standalone: false, templateUrl: './contact.html', styleUrl: './contact.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(false); readonly submitted = signal(false);
  readonly form = this.fb.nonNullable.group({ fullName: ['', [Validators.required, Validators.minLength(2)]], email: ['', [Validators.required, Validators.email]], phone: ['', [Validators.pattern(/^\+?[0-9 ()-]{8,20}$/)]], subject: ['', Validators.required], requestType: ['PROJECT', Validators.required], message: ['', [Validators.required, Validators.minLength(20)]], consent: [false, Validators.requiredTrue] });
  control(name: string) { return this.form.get(name); }
  submit(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.loading.set(true); /* TODO(contact-api): connecter ce formulaire lorsqu'un endpoint de contact sera exposé. */ setTimeout(() => { this.loading.set(false); this.submitted.set(true); this.form.reset({ requestType: 'PROJECT', consent: false, fullName: '', email: '', phone: '', subject: '', message: '' }); }, 450); }
}
