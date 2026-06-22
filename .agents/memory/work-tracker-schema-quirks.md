---
name: WorkTracker schema quirks
description: Non-obvious field names and types in the WorkTracker API schemas
---

## AdminStats — hours not minutes
`totalHoursThisWeek` and `totalHoursThisMonth` are already in **hours** (not minutes).
Display directly: `stats.totalHoursThisWeek.toFixed(1) + "h"`.

Fields that exist: `totalUsers`, `activeUsersToday`, `totalHoursThisWeek`, `totalHoursThisMonth`, `totalLogins`, `avgDailyProductivity`.
Fields that do NOT exist: `activeToday`, `currentlyWorking`, `avgWorkedMinutesToday`, `avgProductivityPercent`, `totalWorkedMinutesWeek`.

## Optional number fields — always use `?? 0`
These fields are optional (`number | undefined`) in their schemas:
- `WeeklyReport.overtimeMinutes`, `WeeklyReport.missingMinutes`
- `MonthlyReport.overtimeMinutes`, `MonthlyReport.productivityPercent`
- `DailyReportRow.completionPercent`

Always guard with `?? 0` before arithmetic or rendering.

## UserUpdate — no password
`UserUpdate` does not include `password`. Password is only set via `UserCreate`.
Admin user edit forms must hide the password field and only show it on create.

## UserMonitoring — hours not minutes
`hoursToday` and `hoursThisWeek` are in hours. No `progressPercent` or `isCurrentlyWorking` field; use `status === UserMonitoringStatus.working` instead.

## ListLoginActivityParams — no date or success filter
Only supports `{ userId?, limit? }`. No `from`, `to`, or `success` params.

## WeeklyAnalytics — no userBreakdown
Shape is `{ weekStart: string, days: DayAnalytics[] }`. No `totalWorkedMinutes` or `userBreakdown` at the top level.

## GetWeeklyAnalyticsParams
Has `week` (singular ISO date string), NOT `weeks`.
