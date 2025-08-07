import { createAppointment, listUpcomingAppointments, cancelAppointment } from '../db.js';
export function parseDateTimeToEpoch(input, tz) {
    const normalized = input.trim().replace(/\s+/g, ' ');
    const tryIso = Date.parse(normalized);
    if (!Number.isNaN(tryIso))
        return Math.floor(tryIso / 1000);
    return null;
}
export function bookAppointment(opts) {
    const duration = (opts.durationMinutes || 60) * 60;
    const endTs = opts.startTs + duration;
    const id = createAppointment(opts.businessId, opts.customerId, opts.startTs, endTs, opts.notes);
    return id;
}
export function listAppointmentsText(businessId, customerId) {
    const nowTs = Math.floor(Date.now() / 1000);
    const appts = listUpcomingAppointments(businessId, customerId, nowTs);
    if (!appts.length)
        return 'You have no upcoming appointments.';
    const lines = appts.map(a => `#${a.id} - ${new Date(a.start_ts * 1000).toLocaleString()} (${Math.round((a.end_ts - a.start_ts) / 60)}m)`);
    return 'Upcoming appointments:\n' + lines.join('\n');
}
export function cancelAppointmentText(apptId, customerId) {
    const ok = cancelAppointment(apptId, customerId);
    return ok ? `Appointment #${apptId} cancelled.` : 'Unable to cancel that appointment.';
}
//# sourceMappingURL=scheduling.js.map