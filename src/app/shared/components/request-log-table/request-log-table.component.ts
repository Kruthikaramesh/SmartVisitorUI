import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestLog } from '../../../shared/models/request-log.model';

@Component({
  selector: 'app-request-log-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="log-container">
      <div class="log-header">
        <h3>{{ title }}</h3>
        <div class="filters">
          <input
            type="text"
            placeholder="Search visitor name..."
            [(ngModel)]="searchText"
            (keyup)="applyFilters()"
            class="search-input"
          />
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="log-table">
          <thead>
            <tr>
              <th>Visitor Name</th>
              <th>Action Type</th>
              <th>Status</th>
              <th>Action By</th>
              <th>Action Time</th>
              <th>Valid Till</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredLogs.length === 0" class="no-data">
              <td colspan="7">No logs found</td>
            </tr>
            <tr *ngFor="let log of filteredLogs" [ngClass]="'status-' + log.status.toLowerCase()">
              <td>{{ log.visitorName }}</td>
              <td>
                <span class="badge" [ngClass]="'action-' + log.actionType.toLowerCase()">
                  {{ formatActionType(log.actionType) }}
                </span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + log.status.toLowerCase()">
                  {{ log.status }}
                </span>
              </td>
              <td>{{ log.actionBy }}</td>
              <td>{{ formatDate(log.actionAt) }}</td>
              <td>{{ formatDate(log.validTill) }}</td>
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

    .log-table tbody tr.status-expired,
    .log-table tbody tr.status-rejected {
      background-color: #fff5f5;
    }

    .log-table tbody tr.status-approved {
      background-color: #f0f9ff;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge.action-approve {
      background-color: #c8e6c9;
      color: #2e7d32;
    }

    .badge.action-reject {
      background-color: #ffcdd2;
      color: #c62828;
    }

    .badge.action-expire {
      background-color: #fff9c4;
      color: #f57f17;
    }

    .badge.action-create {
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

    .status-badge.status-rejected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-badge.status-expired {
      background-color: #e2e3e5;
      color: #383d41;
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
      }

      .search-input {
        width: 100%;
      }

      .log-table th,
      .log-table td {
        padding: 0.5rem;
        font-size: 0.85rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestLogTableComponent implements OnInit {
  @Input() logs: RequestLog[] = [];
  @Input() title: string = 'Request Logs';

  filteredLogs: RequestLog[] = [];
  searchText = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.filteredLogs = [...this.logs];
  }

  ngOnChanges(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredLogs = this.logs.filter(log => {
      const matchesSearch = !this.searchText ||
        log.visitorName.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = !this.selectedStatus || log.status === this.selectedStatus.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }

  formatActionType(action: string): string {
    const map: { [key: string]: string } = {
      'APPROVE': 'Approved',
      'REJECT': 'Rejected',
      'EXPIRE': 'Expired',
      'CREATE': 'Created'
    };
    return map[action] || action;
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
