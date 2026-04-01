import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityLog } from '../../../shared/models/security-log.model';

@Component({
  selector: 'app-security-log-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="log-container">
      <div class="log-header">
        <h3>{{ title }}</h3>
        <div class="filters">
          <input
            type="text"
            placeholder="Search visitor or token..."
            [(ngModel)]="searchText"
            (keyup)="applyFilters()"
            class="search-input"
          />
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="EXPIRED">Expired</option>
            <option value="DENIED">Denied</option>
            <option value="PENDING">Pending</option>
          </select>
          <select [(ngModel)]="selectedAction" (change)="applyFilters()" class="filter-select">
            <option value="">All Actions</option>
            <option value="CHECK_IN">Check In</option>
            <option value="CHECK_OUT">Check Out</option>
            <option value="SCAN">Scan</option>
            <option value="MANUAL_VERIFICATION">Manual Verify</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="log-table">
          <thead>
            <tr>
              <th>Visitor Name</th>
              <th>Token</th>
              <th>Action</th>
              <th>Status</th>
              <th>Scan Method</th>
              <th>Verified By</th>
              <th>Verified At</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredLogs.length === 0" class="no-data">
              <td colspan="8">No security logs found</td>
            </tr>
            <tr *ngFor="let log of filteredLogs" [ngClass]="'status-' + log.verificationStatus.toLowerCase()">
              <td class="visitor-name">{{ log.visitorName }}</td>
              <td class="token">{{ log.token }}</td>
              <td>
                <span class="badge" [ngClass]="'action-' + log.actionType.toLowerCase()">
                  {{ formatActionType(log.actionType) }}
                </span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + log.verificationStatus.toLowerCase()">
                  {{ log.verificationStatus }}
                </span>
              </td>
              <td>
                <span class="method-badge">{{ formatScanMethod(log.scanMethod) }}</span>
              </td>
              <td>{{ log.verifiedBy }}</td>
              <td>{{ formatDate(log.verifiedAt) }}</td>
              <td class="remarks">{{ log.remarks || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="page-info">Showing {{ filteredLogs.length }} of {{ logs.length }} logs</span>
      </div>
    </div>
  `,
  styles: [`
    .log-container {
      margin-top: 2rem;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fafafa;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .log-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.25rem;
    }

    .filters {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .search-input,
    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
      background-color: white;
    }

    .search-input {
      min-width: 200px;
    }

    .search-input:focus,
    .filter-select:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 4px rgba(33, 150, 243, 0.2);
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .log-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
    }

    .log-table thead {
      background-color: #f5f5f5;
      border-bottom: 2px solid #ddd;
    }

    .log-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #555;
      font-size: 0.9rem;
    }

    .log-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #eee;
      font-size: 0.9rem;
    }

    .log-table tbody tr:hover {
      background-color: #f9f9f9;
    }

    .log-table tbody tr.status-denied {
      background-color: #fff5f5;
    }

    .log-table tbody tr.status-approved {
      background-color: #f0f9ff;
    }

    .log-table tbody tr.status-expired {
      background-color: #fffbea;
    }

    .visitor-name, .token {
      font-weight: 500;
    }

    .token {
      font-family: monospace;
      font-size: 0.85rem;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge.action-check_in {
      background-color: #c8e6c9;
      color: #2e7d32;
    }

    .badge.action-check_out {
      background-color: #ffe0b2;
      color: #e65100;
    }

    .badge.action-scan {
      background-color: #b3e5fc;
      color: #01579b;
    }

    .badge.action-manual_verification {
      background-color: #e1bee7;
      color: #6a1b9a;
    }

    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 4px;
      font-weight: 500;
      font-size: 0.85rem;
    }

    .status-badge.status-pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-badge.status-approved {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.status-denied {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-badge.status-expired {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .method-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 0.8rem;
      color: #666;
    }

    .remarks {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-data {
      text-align: center;
      color: #999;
      padding: 2rem !important;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .page-info {
      color: #666;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .log-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .filters {
        width: 100%;
        flex-direction: column;
      }

      .search-input,
      .filter-select {
        width: 100%;
      }

      .log-table th,
      .log-table td {
        padding: 0.5rem;
        font-size: 0.8rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityLogTableComponent implements OnInit {
  @Input() logs: SecurityLog[] = [];
  @Input() title: string = 'Security Verification Logs';

  filteredLogs: SecurityLog[] = [];
  searchText = '';
  selectedStatus = '';
  selectedAction = '';

  ngOnInit(): void {
    this.filteredLogs = [...this.logs];
  }

  ngOnChanges(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredLogs = this.logs.filter(log => {
      const matchesSearch = !this.searchText ||
        log.visitorName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        log.token.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = !this.selectedStatus || log.verificationStatus === this.selectedStatus.toUpperCase();
      const matchesAction = !this.selectedAction || log.actionType === this.selectedAction.toUpperCase();
      return matchesSearch && matchesStatus && matchesAction;
    });
  }

  formatActionType(action: string): string {
    const map: { [key: string]: string } = {
      'CHECK_IN': 'Check In',
      'CHECK_OUT': 'Check Out',
      'SCAN': 'Scan',
      'MANUAL_VERIFICATION': 'Manual Verify'
    };
    return map[action] || action;
  }

  formatScanMethod(method: string): string {
    const map: { [key: string]: string } = {
      'QR_CODE': 'QR Code',
      'MANUAL': 'Manual',
      'CAMERA': 'Camera'
    };
    return map[method] || method;
  }

  formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  }
}
