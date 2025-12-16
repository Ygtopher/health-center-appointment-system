// USSD Menu Handler Utilities
// Supports both English and Kinyarwanda

const USSD_MENUS = {
  en: {
    main: {
      text: 'Welcome to Health Center System\n1. Book Appointment\n2. Cancel Appointment\n3. Check Appointment Status\n4. Language/Ururimi',
      options: {
        '1': 'book_appointment',
        '2': 'cancel_appointment',
        '3': 'check_status',
        '4': 'change_language',
      },
    },
    book_appointment: {
      text: 'Enter your National ID number:',
      next: 'select_health_center',
    },
    select_health_center: {
      text: 'Select Health Center:\n',
      next: 'select_appointment_type',
    },
    select_appointment_type: {
      text: 'Select Appointment Type:\n1. General\n2. Emergency\n3. Follow-up\n4. Consultation',
      next: 'select_date',
    },
    select_date: {
      text: 'Enter appointment date (DD-MM-YYYY):',
      next: 'select_time',
    },
    select_time: {
      text: 'Select time slot:\n',
      next: 'confirm_booking',
    },
    confirm_booking: {
      text: 'Confirm appointment?\n1. Yes\n2. No',
      options: {
        '1': 'booking_confirmed',
        '2': 'main',
      },
    },
    cancel_appointment: {
      text: 'Enter your National ID number:',
      next: 'list_appointments',
    },
    check_status: {
      text: 'Enter your National ID number:',
      next: 'show_status',
    },
    cancel_selected: {
      text: 'Confirm cancellation?\n1. Yes\n2. No',
      options: {
        '1': 'cancellation_confirmed',
        '2': 'main',
      },
    },
  },
  rw: {
    main: {
      text: 'Murakaza neza kuri Sisitemu y\'Ihuriro ry\'Ubuzima\n1. Gena Randevu\n2. Kuraho Randevu\n3. Reba Imiterere y\'Randevu\n4. Ururimi/Language',
      options: {
        '1': 'book_appointment',
        '2': 'cancel_appointment',
        '3': 'check_status',
        '4': 'change_language',
      },
    },
    book_appointment: {
      text: 'Injiza Numero y\'Indangamuntu yawe:',
      next: 'select_health_center',
    },
    select_health_center: {
      text: 'Hitamo Ihuriro ry\'Ubuzima:\n',
      next: 'select_appointment_type',
    },
    select_appointment_type: {
      text: 'Hitamo Ubwoko bw\'Randevu:\n1. Rusange\n2. Byihutirwa\n3. Gukurikirana\n4. Inama',
      next: 'select_date',
    },
    select_date: {
      text: 'Injiza Itariki (DD-MM-YYYY):',
      next: 'select_time',
    },
    select_time: {
      text: 'Hitamo Igihe:\n',
      next: 'confirm_booking',
    },
    confirm_booking: {
      text: 'Emeza Randevu?\n1. Yego\n2. Oya',
      options: {
        '1': 'booking_confirmed',
        '2': 'main',
      },
    },
    cancel_appointment: {
      text: 'Injiza Numero y\'Indangamuntu yawe:',
      next: 'list_appointments',
    },
    check_status: {
      text: 'Injiza Numero y\'Indangamuntu yawe:',
      next: 'show_status',
    },
    cancel_selected: {
      text: 'Emeza gukuraho?\n1. Yego\n2. Oya',
      options: {
        '1': 'cancellation_confirmed',
        '2': 'main',
      },
    },
  },
};

class USSDHandler {
  constructor() {
    this.sessions = new Map(); // Store user sessions
  }

  // Clean up old sessions (older than 15 minutes)
  cleanupSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > 15 * 60 * 1000) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Get or create session
  getSession(sessionId, phoneNumber) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        phoneNumber,
        language: 'en', // Default to English
        step: 'main',
        data: {},
        lastActivity: Date.now(),
      });
    } else {
      this.sessions.get(sessionId).lastActivity = Date.now();
    }
    return this.sessions.get(sessionId);
  }

  // Format USSD response
  formatResponse(text, isEnd = false) {
    return {
      // Africa's Talking USSD API requires responses to start with
      // "CON " for continuation or "END " for session termination.
      response: `${isEnd ? 'END' : 'CON'} ${text}`,
      isEnd: isEnd,
    };
  }

  // Get menu text
  getMenuText(step, language, data = {}) {
    const menu = USSD_MENUS[language]?.[step];
    if (!menu) {
      return language === 'rw'
        ? 'Ikibazo cyahagaragaye. Ongera ugerageze.'
        : 'An error occurred. Please try again.';
    }

    let text = menu.text;

    // Replace placeholders with data - only include data relevant to current step
    if (step === 'select_health_center' && data.healthCenters) {
      const centers = data.healthCenters.map((hc, idx) =>
        `${idx + 1}. ${language === 'rw' ? hc.name_kinyarwanda || hc.name : hc.name}`
      ).join('\n');
      text += centers;
    }

    if (step === 'select_time' && data.timeSlots) {
      const slots = data.timeSlots.map((slot, idx) =>
        `${idx + 1}. ${slot}`
      ).join('\n');
      text += slots;
    }

    if (data.appointment) {
      const appt = data.appointment;
      const date = new Date(appt.appointment_date).toLocaleDateString();
      text += `\n\nDate: ${date}\nTime: ${appt.appointment_time}\nStatus: ${appt.status}`;
    }

    return text;
  }

  // Process USSD input
  async processInput(sessionId, phoneNumber, text, language = 'en') {
    this.cleanupSessions();
    const session = this.getSession(sessionId, phoneNumber);
    session.language = language;

    const input = text.trim();
    const currentStep = session.step;
    const menu = USSD_MENUS[language][currentStep];

    if (!menu) {
      return this.formatResponse(
        language === 'rw'
          ? 'Ikibazo cyahagaragaye. Ongera ugerageze.'
          : 'An error occurred. Please try again.',
        true
      );
    }

    // Handle option selection (but skip for cancel_selected if we haven't selected appointment yet)
    if (menu.options && menu.options[input] && !(currentStep === 'cancel_selected' && !session.data.selectedAppointment)) {
      const nextStep = menu.options[input];
      if (nextStep === 'change_language') {
        session.language = language === 'en' ? 'rw' : 'en';
        session.step = 'main';
        return this.formatResponse(
          this.getMenuText('main', session.language),
          false
        );
      }
      // If going back to main from cancel_selected, clear selected appointment
      if (currentStep === 'cancel_selected' && nextStep === 'main') {
        session.data.selectedAppointment = null;
      }
      session.step = nextStep;
      return this.formatResponse(
        this.getMenuText(nextStep, session.language, session.data),
        false
      );
    }

    // Handle text input based on current step
    switch (currentStep) {
      case 'book_appointment':
        if (this.isValidNationalID(input)) {
          session.data.nationalId = input;
          session.step = menu.next;
          // Will be populated by controller
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Indangamuntu ntabwo ari yo. Ongera ugerageze.'
            : 'Invalid National ID. Please try again.',
          false
        );

      case 'cancel_appointment':
        if (this.isValidNationalID(input)) {
          session.data.nationalId = input;
          session.step = menu.next;
          // Will be populated by controller
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Indangamuntu ntabwo ari yo. Ongera ugerageze.'
            : 'Invalid National ID. Please try again.',
          false
        );

      case 'check_status':
        if (this.isValidNationalID(input)) {
          session.data.nationalId = input;
          session.step = menu.next;
          // Will be populated by controller
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Indangamuntu ntabwo ari yo. Ongera ugerageze.'
            : 'Invalid National ID. Please try again.',
          false
        );

      case 'select_health_center':
        const centerIndex = parseInt(input) - 1;
        if (session.data.healthCenters && session.data.healthCenters[centerIndex]) {
          session.data.selectedHealthCenter = session.data.healthCenters[centerIndex];
          session.step = menu.next;
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Hitamo Ihuriro ry\'Ubuzima. Ongera ugerageze.'
            : 'Invalid selection. Please try again.',
          false
        );

      case 'select_appointment_type':
        const typeOptions = ['general', 'emergency', 'follow_up', 'consultation'];
        const selectedType = typeOptions[parseInt(input) - 1];
        if (selectedType) {
          session.data.appointmentType = selectedType;
          session.step = menu.next;
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Hitamo ubwoko bw\'randevu. Ongera ugerageze.'
            : 'Invalid appointment type. Please try again.',
          false
        );

      case 'select_date':
        if (this.isValidDate(input)) {
          session.data.selectedDate = input;
          session.step = menu.next;
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Itariki ntabwo ari yo. Ongera ugerageze (DD-MM-YYYY).'
            : 'Invalid date. Please try again (DD-MM-YYYY).',
          false
        );

      case 'select_time':
        const timeIndex = parseInt(input) - 1;
        if (session.data.timeSlots && session.data.timeSlots[timeIndex]) {
          session.data.selectedTime = session.data.timeSlots[timeIndex];
          session.step = menu.next;
          return this.formatResponse(
            this.getMenuText(menu.next, language, session.data),
            false
          );
        }
        return this.formatResponse(
          language === 'rw'
            ? 'Igihe ntabwo ari cyo. Ongera ugerageze.'
            : 'Invalid time slot. Please try again.',
          false
        );

      case 'confirm_booking':
        if (input === '1' || input.toLowerCase() === 'yes' || input.toLowerCase() === 'yego') {
          session.step = 'booking_confirmed';
          return this.formatResponse(
            language === 'rw'
              ? 'Randevu yagenwe neza! Uzabona SMS yibuka.'
              : 'Appointment booked successfully! You will receive a reminder SMS.',
            true
          );
        } else {
          session.step = 'main';
          return this.formatResponse(
            this.getMenuText('main', language),
            false
          );
        }

      case 'cancel_selected':
        // If we already have a selected appointment, we're in confirmation mode
        if (session.data.selectedAppointment) {
          // Handle confirmation (1 = yes, 2 = no)
          if (input === '1' || input.toLowerCase() === 'yes' || input.toLowerCase() === 'yego') {
            session.step = 'cancellation_confirmed';
            return this.formatResponse(
              language === 'rw'
                ? 'Gutegereza...'
                : 'Processing...',
              false
            );
          } else {
            // User cancelled, return to main menu
            session.step = 'main';
            session.data.selectedAppointment = null;
            return this.formatResponse(
              this.getMenuText('main', language),
              false
            );
          }
        } else {
          // Handle appointment selection (number input)
          const appointmentIndex = parseInt(input) - 1;
          if (session.data.appointments && session.data.appointments[appointmentIndex]) {
            session.data.selectedAppointment = session.data.appointments[appointmentIndex];
            // Show confirmation menu
            const confirmMenu = USSD_MENUS[language]['cancel_selected'];
            if (confirmMenu) {
              return this.formatResponse(
                confirmMenu.text,
                false
              );
            }
          }
          return this.formatResponse(
            language === 'rw'
              ? 'Hitamo randevu. Ongera ugerageze.'
              : 'Invalid selection. Please try again.',
            false
          );
        }

      default:
        return this.formatResponse(
          this.getMenuText('main', language),
          false
        );
    }
  }

  isValidNationalID(id) {
    // Rwanda National ID format: typically 16 digits
    return /^\d{13,16}$/.test(id);
  }

  isValidDate(dateString) {
    // Format: DD-MM-YYYY
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(dateString)) return false;

    const [, day, month, year] = dateString.match(regex);
    const date = new Date(`${year}-${month}-${day}`);
    return date instanceof Date && !isNaN(date) &&
      date >= new Date().setHours(0, 0, 0, 0);
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

module.exports = new USSDHandler();

