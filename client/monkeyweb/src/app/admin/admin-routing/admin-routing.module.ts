import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  MatIconModule,
  MatButtonModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatTableModule,
  MatFormFieldModule,
  MatInputModule,
  MatCardModule,
  MatGridListModule,
  MatProgressSpinnerModule
} from '@angular/material';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';

import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { AdminStudentComponent } from '../admin-student/admin-student.component';
import { AdminClassComponent } from '../admin-class/admin-class.component';

const adminRoutes: Routes = [
  {
    path: '',
    component: AdminNavComponent,
    children: [
      {
        path: 'student',
        component: AdminStudentComponent
      },
      {
        path: 'class',
        component: AdminClassComponent
      }
    ]
  }
];
@NgModule({
  declarations: [AdminNavComponent, AdminStudentComponent, AdminClassComponent],
  imports: [
    RouterModule.forChild(adminRoutes),
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatGridListModule,
    MatButtonModule,
    MatFormFieldModule,
    MatListModule,
    MatTableModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FontAwesomeModule
  ],
  exports: [RouterModule],
  providers: []
})
export class AdminRoutingModule { }