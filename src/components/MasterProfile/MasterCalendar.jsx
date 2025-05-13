import React, { useState, useEffect } from "react";
import "./MasterCalendar.css";

function MasterCalendar({
  bookings: propBookings,
  selectedDate,
  onDateChange,
  onSelectBooking,
  master_id,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [apiBookings, setApiBookings] = useState([]);
  const [customApiBookings, setCustomApiBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceNames, setServiceNames] = useState({});

  async function getServiceNameById(serviceId) {
    try {
      const response = await fetch(
        `https://api.kuchizu.online/services/${serviceId}`,
        {
          headers: { accept: "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error(`Service ${serviceId} not found`);
      }
      const data = await response.json();
      return data.service_name;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // Получение записей с API
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Загрузка обычных бронирований
        const response = await fetch("https://api.kuchizu.online/appointments");
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные о бронированиях");
        }
        const data = await response.json();
        const filteredData = data.filter(
          (item) => item.master_id === master_id && item.status === 'booked'
        );
        
        // Загрузка пользовательских бронирований
        const customResponse = await fetch("https://api.kuchizu.online/custom_appointments");
        if (!customResponse.ok) {
          throw new Error("Не удалось загрузить данные о пользовательских бронированиях");
        }
        const customData = await customResponse.json();
        const filteredCustomData = customData.filter(
          (item) => item.master_id === master_id
        );
        
        // Получаем уникальные service_id из всех бронирований
        const allBookings = [...filteredData, ...filteredCustomData];
        const uniqueServiceIds = [...new Set(allBookings.map(booking => booking.service_id))];
        
        // Получаем названия услуг для всех уникальных service_id
        const serviceNamesMap = {};
        for (const serviceId of uniqueServiceIds) {
          if (serviceId) {
            const serviceName = await getServiceNameById(serviceId);
            serviceNamesMap[serviceId] = serviceName;
          }
        }
        setServiceNames(serviceNamesMap);
        setApiBookings(filteredData);
        setCustomApiBookings(filteredCustomData);
      } catch (err) {
        console.error("Ошибка при загрузке бронирований:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [master_id]);
  console.log(serviceNames)
  // Комбинируем бронирования из пропсов и API
  const allBookings = [
    ...(propBookings || []),
    ...apiBookings.map((booking) => ({
      id: booking.id,
      client_name: booking.client_name,
      service_id: booking.service_id,
      service_name: booking.service_name || "Услуга",
      appointment_datetime: booking.appointment_datetime,
      start_time: booking.appointment_datetime, // Для обратной совместимости
      is_blocked: booking.status === "blocked",
      is_personal: booking.status === "personal",
      comment: booking.comment,
      // Добавляем оригинальные данные для возможного использования
      original_data: booking,
    })),
    ...customApiBookings.map((booking) => ({
      id: booking.id,
      client_name: booking.client_name,
      service_id: booking.service_id,
      service_name: booking.service_name || "Пользовательская услуга",
      appointment_datetime: booking.appointment_datetime,
      start_time: booking.start_time || booking.appointment_datetime,
      end_time: booking.end_time,
      is_blocked: booking.status === "blocked",
      is_personal: booking.status === "personal",
      comment: booking.comment,
      // Добавляем оригинальные данные для возможного использования
      original_data: booking,
      is_custom: true,
    })),
  ];

  // Переход к предыдущему дню
  const prevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  // Переход к следующему дню
  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  // Переход к текущему дню
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange(today);
  };

  // Проверка на текущий день
  const isToday = (date) => {
    const today = new Date();
    return (
      today.getDate() === date.getDate() &&
      today.getMonth() === date.getMonth() &&
      today.getFullYear() === date.getFullYear()
    );
  };

  // Проверка выбранного дня
  const isSelected = (date) => {
    return (
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear()
    );
  };

  // Получение записей для определенного дня
  const getDayBookings = (date) => {
    return allBookings.filter((booking) => {
      // Проверяем наличие разных полей с датой (date, start_time, appointment_datetime)
      const dateField = booking.date || booking.start_time || booking.appointment_datetime || 
                       (booking.original_data && booking.original_data.appointment_datetime);
      
      if (!dateField) return false;
      
      const bookingDate = new Date(dateField);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Обработчик клика на день
  const handleDayClick = (date) => {
    // Создаем новую дату, сохраняя точно тот же день, месяц и год
    const selectedDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0
    );
    onDateChange(selectedDay);
  };

  // Получаем список дат для отображения (3 дня до, выбранный день и 3 дня после)
  const getDatesForDisplay = () => {
    const dates = [];
    const centerDate = new Date(selectedDate);

    // Добавляем 3 дня до выбранной даты
    for (let i = -3; i <= 3; i++) {
      const dateToAdd = new Date(centerDate);
      dateToAdd.setDate(centerDate.getDate() + i);
      dates.push(dateToAdd);
    }

    return dates;
  };

  // Форматирование времени
  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Название дней недели
  const weekdayNames = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

  // Название месяцев
  const monthNames = [
    "Января",
    "Февраля",
    "Марта",
    "Апреля",
    "Мая",
    "Июня",
    "Июля",
    "Августа",
    "Сентября",
    "Октября",
    "Ноября",
    "Декабря",
  ];

  // Отрисовка дней
  const renderDays = () => {
    return getDatesForDisplay().map((date, index) => {
      const dayBookings = getDayBookings(date);
      const hasBookings = dayBookings.length > 0;

      return (
        <div
          key={`day-${index}`}
          className={`calendar-day-view ${isToday(date) ? "today" : ""} ${
            isSelected(date) ? "selected" : ""
          }`}
          onClick={() => handleDayClick(date)}
        >
          <div className="day-header">
            <span className="day-name">{weekdayNames[date.getDay()]}</span>
            <span className="day-number">{date.getDate()}</span>
            <span className="day-month">
              {monthNames[date.getMonth()].substring(0, 3)}
            </span>
          </div>

          {hasBookings ? (
            <div className="day-bookings-preview">
              {dayBookings.slice(0, 2).map((booking, idx) => (
                <div
                  key={idx}
                  className={`booking-preview ${
                    booking.is_blocked
                      ? "blocked"
                      : booking.is_personal
                      ? "personal"
                      : ""
                  }`}
                >
                  <span className="booking-time">
                    {formatTime(booking.start_time)}
                  </span>
                  <span className="booking-title">
                    {booking.service_name || "Личное время"}
                  </span>
                </div>
              ))}
              {dayBookings.length > 2 && (
                <div className="more-bookings">
                  + ещё {dayBookings.length - 2}
                </div>
              )}
            </div>
          ) : (
            <div className="day-bookings-preview empty">
              <span className="no-bookings-indicator">•••</span>
            </div>
          )}
        </div>
      );
    });
  };

  // Отображение расписания на выбранный день
  const renderSelectedDaySchedule = () => {
    const dayBookings = getDayBookings(selectedDate).sort((a, b) => {
      const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return timeA - timeB;
    });

    if (dayBookings.length === 0) {
      return (
        <div className="no-bookings">
          <p>На этот день нет записей.</p>
        </div>
      );
    }

    return (
      <div>
        {isLoading && (
          <div className="loading-message">Загрузка бронирований...</div>
        )}
        {error && <div className="error-message">Ошибка: {error}</div>}
        <div className="bookings-list">
          {dayBookings.map((booking) => {
            return (
              <div
                key={booking.id}
                className={`booking-item ${
                  booking.is_blocked
                    ? "blocked"
                    : booking.is_personal
                    ? "personal"
                    : ""
                }`}
                onClick={() => onSelectBooking(booking)}
              >
                <div className="booking-time">
                  {formatTime(booking.start_time)}
                  {booking.end_time && ` - ${formatTime(booking.end_time)}`}
                </div>
                <div className="booking-info">
                  <div className="booking-title">
                    {booking.service_name || "Личное время"}
                  </div>
                  <div className="booking-client">
                    {booking.client_name ||
                      (booking.is_personal
                        ? "Личная запись"
                        : booking.is_blocked
                        ? "Забронировано"
                        : "Нет данных")}
                  </div>
                  {booking.comment && (
                    <div className="booking-comment">{booking.comment}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="master-calendar-container">
      <div className="calendar-controls">
        <button onClick={prevDay} className="calendar-nav-btn">
          ←
        </button>
        <button onClick={nextDay} className="calendar-nav-btn">
          →
        </button>
      </div>

      <div className="calendar-days-container">{renderDays()}</div>

      <div className="selected-day-schedule">{renderSelectedDaySchedule()}</div>
    </div>
  );
}

export default MasterCalendar;
