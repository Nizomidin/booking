import React, { useState, useEffect } from "react";
import "./BookingDetails.css";

function BookingDetails({ booking, masterId, onBack, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [editData, setEditData] = useState({
    clientName: "",
    service_id: "",
    date: "",
    startTime: "",
    endTime: "", // Добавляем поле для времени окончания
    notes: "",
  });
  const [timeError, setTimeError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [manualTimeInput, setManualTimeInput] = useState(false); // Переключатель для ручного ввода времени

  // Инициализируем поля при выборе брони
  useEffect(() => {
    if (!booking) return;

    const dt = new Date(booking.appointment_datetime || Date.now());
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    const hh = String(dt.getHours()).padStart(2, "0");
    const mi = String(dt.getMinutes()).padStart(2, "0");

    // Если есть end_time (для кастомных бронирований), парсим его
    let endTimeValue = "";
    if (booking.end_time) {
      const endDt = new Date(booking.end_time);
      const endHh = String(endDt.getHours()).padStart(2, "0");
      const endMi = String(endDt.getMinutes()).padStart(2, "0");
      endTimeValue = `${endHh}:${endMi}`;

      // Автоматически включаем ручной ввод для кастомных бронирований
      setManualTimeInput(true);
    } else {
      setManualTimeInput(false);
    }

    // Создаем начальное состояние
    const initialData = {
      clientName: booking.client_name || "",
      service_id: booking.service_id || "",
      service_name: booking.service_name || "",
      date: `${yy}-${mm}-${dd}`,
      startTime: `${hh}:${mi}`,
      endTime: endTimeValue,
      notes: booking.comment || "",
    };

    // Установим состояние
    setEditData(initialData);
    setSelectedSlot(null);
    setTimeError("");
  }, [booking]);

  // Загрузка услуг по masterId
  useEffect(() => {
    if (!masterId) return;
    setServicesLoading(true);

    // Загружаем все услуги
    fetch("https://api.kuchizu.online/services", {
      headers: { accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки услуг");
        return res.json();
      })
      .then((data) => {
        // Фильтруем услуги для конкретного мастера
        const filteredServices = data.filter(
          (svc) => svc.master_id === masterId
        );
        setServices(filteredServices);
        console.log(
          `Загружено ${filteredServices.length} услуг мастера ${masterId}`
        );

        // Если есть booking и у него есть service_name, но нет service_id или service_id не соответствует ни одной услуге,
        // найдем подходящую услугу по service_name
        if (booking && booking.service_name) {
          // Проверяем, если у нас нет service_id или service_id не соответствует ни одной услуге
          const needToFindServiceId = !booking.service_id || 
            !filteredServices.some(s => s.id === booking.service_id);
          
          if (needToFindServiceId) {
            // Ищем услугу с таким же именем
            const matchedService = filteredServices.find(
              s => s.service_name === booking.service_name
            );
            
            if (matchedService) {
              console.log(`Найдена подходящая услуга по имени: ${matchedService.service_name} (id: ${matchedService.id})`);
              // Обновляем service_id
              setEditData(prev => ({
                ...prev,
                service_id: matchedService.id
              }));
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, [masterId, booking]);

  // Загрузка слотов после выбора услуги или даты
  useEffect(() => {
    if (!editData.service_id || !editData.date) return;
    setSlotsLoading(true);
    fetch(
      `https://api.kuchizu.online/masters/${masterId}/available?date=${editData.date}`,
      { headers: { accept: "application/json" } }
    )
      .then((res) => {
        if (!res.ok) {
          // Если код ответа 404 и сообщение об ошибке указывает на выходной день
          if (res.status === 404) {
            return res.json().then((errorData) => {
              if (errorData.detail && errorData.detail.includes("выходной")) {
                // Возвращаем пустой массив слотов
                return [];
              }
              throw new Error("Ошибка загрузки слотов");
            });
          }
          throw new Error("Ошибка загрузки слотов");
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          setAvailableTimeSlots([]);
          return;
        }
        const svc = services.find((s) => s.id === editData.service_id);
        setAvailableTimeSlots(
          svc ? data.filter((slot) => slot.service === svc.service_name) : []
        );
      })
      .catch((error) => {
        console.error(error);
        setAvailableTimeSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  }, [editData.service_id, editData.date, masterId, services]);

  // Выводим сообщение в консоль для отладки
  useEffect(() => {
    if (booking && services.length > 0) {
      console.log("Текущее состояние:");
      console.log("- booking.service_name:", booking.service_name);
      console.log("- booking.service_id:", booking.service_id);
      console.log("- editData.service_id:", editData.service_id);
      
      const selectedService = services.find(s => s.id === editData.service_id);
      console.log("- Выбранная услуга:", selectedService ? selectedService.service_name : "не выбрана");
    }
  }, [booking, services, editData.service_id]);

  // Обработка изменений полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "service_id") {
      const selectedService = services.find((s) => s.id === value);
      setEditData((prev) => ({
        ...prev,
        service_id: value,
        service_name: selectedService ? selectedService.service_name : "",
        startTime: "",
        endTime: "", // Сбрасываем и время окончания
      }));
      setSelectedSlot(null);
      setTimeError("");
      return;
    }

    // Обработка ручного ввода времени начала
    if (name === "startTime" && manualTimeInput) {
      // Если выбрана услуга, автоматически рассчитываем время окончания
      const selectedService = services.find(
        (s) => s.id === editData.service_id
      );
      if (selectedService && selectedService.duration) {
        const [hours, minutes] = value.split(":").map(Number);
        const durationMinutes = parseInt(selectedService.duration, 10);

        let endHours = hours;
        let endMinutes = minutes + durationMinutes;

        if (endMinutes >= 60) {
          endHours += Math.floor(endMinutes / 60);
          endMinutes %= 60;
        }

        const endTime = `${String(endHours).padStart(2, "0")}:${String(
          endMinutes
        ).padStart(2, "0")}`;

        setEditData((prev) => ({
          ...prev,
          startTime: value,
          endTime: endTime,
        }));
        setTimeError("");
        return;
      }
    }

    setEditData((prev) => ({ ...prev, [name]: value }));
    if (name === "startTime" || name === "endTime") setTimeError("");
  };

  // Выбор слота
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setEditData((prev) => ({
      ...prev,
      startTime: slot.start_time,
      endTime: slot.end_time,
    }));
    setTimeError("");
  };

  // Переключение режима ввода времени
  const toggleTimeInputMode = () => {
    setManualTimeInput(!manualTimeInput);
    if (!manualTimeInput) {
      // При переключении в ручной режим сбрасываем выбранный слот
      setSelectedSlot(null);
    } else {
      // При переключении обратно к слотам сбрасываем введенное время и ошибки
      setEditData((prev) => ({
        ...prev,
        startTime: "",
        endTime: "",
      }));
      setTimeError("");
    }
  };

  // Сохранение изменений
  const handleSave = (e) => {
    e.preventDefault();
    if (!editData.service_id) {
      setTimeError("Выберите услугу");
      return;
    }
    if (!editData.startTime) {
      setTimeError("Выберите время");
      return;
    }
    if (manualTimeInput && !editData.endTime) {
      setTimeError("Укажите время окончания");
      return;
    }

    const appointment_datetime = `${editData.date} ${editData.startTime}`;

    // Различная обработка для обычных и кастомных бронирований
    if (booking.is_custom) {
      // Для кастомных бронирований
      const end_time = `${editData.date} ${editData.endTime}`;
      onUpdate(booking.id, {
        service_name: editData.service_name,
        start_time: appointment_datetime,
        end_time: end_time,
        is_custom: true, // Флаг для определения типа брони на стороне родительского компонента
      });
    } else {
      // Для обычных бронирований
      onUpdate(booking.id, {
        service_id: editData.service_id,
        appointment_datetime: appointment_datetime,
        comment: editData.notes,
      });
    }

    // Закрываем диалоговое окно и возвращаемся к календарю
    setIsEditing(false);
    onBack(); // Вызываем функцию возврата к календарю
  };

  if (!booking) return null;
  return (
    <div className="booking-details">
      <div className="booking-details-header">
        <button className="back-button" onClick={onBack}>
          ← Назад
        </button>
        <h2>
          {booking.is_blocked
            ? "Забронированное время"
            : booking.is_personal
            ? "Личная запись"
            : "Запись клиента"}
        </h2>
      </div>

      {isEditing ? (
        <form className="block-time-form" onSubmit={handleSave}>
          {/* Имя клиента (неизменяемое) */}
          <div className="form-group">
            <label>Имя клиента</label>
            <input
              name="clientName"
              type="text"
              value={editData.clientName}
              readOnly
              disabled
              className="read-only-field"
            />
          </div>

          {/* Селект услуги */}
          <div className="form-group">
            <label>Услуга</label>
            {servicesLoading ? (
              <p>Загрузка услуг...</p>
            ) : (
              <select
                name="service_id"
                value={editData.service_id}
                onChange={handleChange}
                required
              >
                <option value="">Выберите услугу</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.service_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Дата */}
          <div className="form-group">
            <label>Дата</label>
            <input
              name="date"
              type="date"
              value={editData.date}
              onChange={handleChange}
            />
          </div>

          {/* Слоты */}
          <div className="form-group">
            <label className="time-selection-header">
              <span>Выберите доступное время</span>
              <button
                type="button"
                className="toggle-time-mode"
                onClick={toggleTimeInputMode}
              >
                {manualTimeInput ? "Выбрать из доступных" : "Указать вручную"}
              </button>
            </label>

            {!manualTimeInput ? (
              // Режим выбора из предустановленных слотов
              slotsLoading ? (
                <p>Загрузка слотов...</p>
              ) : !editData.service_id ? (
                <p>Сначала выберите услугу</p>
              ) : availableTimeSlots.length ? (
                <div className="available-time-slots">
                  {availableTimeSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={
                        "time-slot" +
                        (editData.startTime === slot.start_time
                          ? " selected"
                          : "")
                      }
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <span className="slot-time">
                        {slot.start_time} – {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Нет доступных интервалов</p>
              )
            ) : (
              // Режим ручного ввода времени
              <div className="manual-time-input">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startTime">Время начала</label>
                    <input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={editData.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endTime">Время окончания</label>
                    <input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={editData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="manual-time-hint">
                  <small>Введите время начала и окончания записи вручную</small>
                </div>
              </div>
            )}
            {/* Показываем текущее выбранное время если оно есть */}
            {!manualTimeInput && editData.startTime && (
              <div className="current-time">
                <p>Текущее выбранное время: {editData.startTime}</p>
              </div>
            )}
          </div>

          
          {timeError && <div className="error-message">{timeError}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setIsEditing(false)}
            >
              Отмена
            </button>
            <button type="submit" className="submit-button">
              Сохранить
            </button>
          </div>
        </form>
      ) : (
        <div className="booking-info-container">
          <div className="booking-info-card">
            {!booking.is_blocked && !booking.is_personal && (
              <div className="info-row">
                <span className="info-label">Клиент:</span>
                <span className="info-value">{booking.client_name || "—"}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Услуга:</span>
              <span className="info-value">
                {booking.service_name || "Личное время"}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Начало:</span>
              <span className="info-value">
                {new Date(booking.start_time).toLocaleString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {booking.end_time && (
              <div className="info-row">
                <span className="info-label">Окончание:</span>
                <span className="info-value">
                  {new Date(booking.end_time).toLocaleString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {booking.comment && (
              <div className="info-row notes">
                <span className="info-label">Примечания:</span>
                <span className="info-value">{booking.comment}</span>
              </div>
            )}
          </div>
          <div className="booking-actions">
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Изменить
            </button>
            <button
              onClick={() => onDelete(booking.id)}
              className="delete-button"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingDetails;
