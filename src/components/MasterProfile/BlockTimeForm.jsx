import React, { useState, useEffect } from "react";
import "./BlockTimeForm.css";

function BlockTimeForm({ onSubmit, onCancel, selectedDate, masterId }) {
  const [formData, setFormData] = useState({
    clientName: "",
    service: "", // будет хранить id выбранной услуги
    date: formatDateForInput(selectedDate),
    startTime: "",
    endTime: "", // Добавлено для ручного ввода времени окончания
    phone: "", // Добавлено для номера телефона
    notes: "",
  });
  const [timeError, setTimeError] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [manualTimeInput, setManualTimeInput] = useState(false); // Переключатель для ручного ввода времени

  function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateForApi(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 1) Загрузка доступных слотов
  useEffect(() => {
    if (!selectedDate || !masterId) return;
    setLoading(true);
    const dateStr = formatDateForApi(selectedDate);

    fetch(
      `https://api.kuchizu.online/masters/${masterId}/available?date=${dateStr}`,
      { headers: { accept: "application/json" } }
    )
      .then((res) => {
        if (res.status === 400) {
          // Если статус 404, значит у мастера выходной день
          setAvailableTimeSlots([]);
          return { slots: [] };
        }
        if (!res.ok) throw new Error("Ошибка загрузки интервалов");
        return res.json();
      })
      .then((data) => setAvailableTimeSlots(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDate, masterId]);

  // 2) Загрузка списка услуг
  useEffect(() => {
    if (!masterId) return;
    setServicesLoading(true);
    fetch("https://api.kuchizu.online/services", {
      headers: { accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки услуг");
        return res.json();
      })
      .then((data) =>
        setServices(data.filter((svc) => svc.master_id === masterId))
      )
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, [masterId]);

  // 3) Определяем, какую услугу выбрали, и фильтруем слоты
  const selectedServiceObj = services.find((s) => s.id === formData.service);
  const timeSlotsToDisplay = formData.service
    ? availableTimeSlots.filter(
        (slot) => slot.service === selectedServiceObj?.service_name
      )
    : [];

  // 4) Обработчик изменения полей
  const handleChange = (e) => {
    const { name, value } = e.target;

    // при смене даты – загружаем слоты на эту дату
    if (name === "date") {
      // Форматируем дату для API
      const formattedDate = formatDateForApi(value);

      // Загружаем доступные слоты для новой даты
      setLoading(true);
      fetch(
        `https://api.kuchizu.online/masters/${masterId}/available?date=${formattedDate}`,
        { headers: { accept: "application/json" } }
      )
        .then((res) => {
          if (res.status === 400) {
            setAvailableTimeSlots([]);
            return { slots: [] };
          }
          if (!res.ok) throw new Error("Ошибка загрузки интервалов");
          return res.json();
        })
        .then((data) => setAvailableTimeSlots(data))
        .catch(console.error)
        .finally(() => setLoading(false));

      // Сбрасываем выбранный слот при смене даты
      setSelectedTimeSlot(null);
      setFormData((prev) => ({
        ...prev,
        date: value,
        startTime: "",
        endTime: "", // Сбрасываем и время окончания
      }));
      return;
    }

    // при смене услуги — сбрасываем выбор слота и времени
    if (name === "service") {
      setSelectedTimeSlot(null);
      setTimeError("");
      setFormData((prev) => ({
        ...prev,
        service: value,
        startTime: "",
        endTime: "", // Сбрасываем и время окончания
      }));
      return;
    }

    // Обработка ручного ввода времени начала
    if (name === "startTime" && manualTimeInput) {
      // Если выбрана услуга, автоматически рассчитываем время окончания
      const selectedService = services.find((s) => s.id === formData.service);
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

        setFormData((prev) => ({
          ...prev,
          startTime: value,
          endTime: endTime,
        }));
        setTimeError("");
        return;
      }
    }

    // Обработка номера телефона
    if (name === "phone") {
      // Удаляем все нецифровые символы
      let phoneValue = value.replace(/\D/g, "");

      // Ограничиваем длину (9 цифр без учета кода страны +992)
      if (phoneValue.length > 9) {
        phoneValue = phoneValue.substring(0, 9);
      }

      setFormData((prev) => ({ ...prev, phone: phoneValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "startTime" || name === "endTime") setTimeError("");
  };
  // 5) Выбор тайм-слота
  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setFormData((prev) => ({
      ...prev,
      startTime: slot.start_time,
      endTime: slot.end_time,
    }));
    setTimeError("");
    setManualTimeInput(false); // При выборе слота отключаем ручной ввод
  };

  // Переключение режима ввода времени
  const toggleTimeInputMode = () => {
    setManualTimeInput(!manualTimeInput);
    if (!manualTimeInput) {
      // При переключении в ручной режим сбрасываем выбранный слот
      setSelectedTimeSlot(null);
    } else {
      // При переключении обратно к слотам сбрасываем введенное время
      setFormData((prev) => ({
        ...prev,
        startTime: "",
        endTime: "",
      }));
    }
  };

  // 6) Отправка формы
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.service) {
      setTimeError("Пожалуйста, выберите услугу");
      return;
    }
    if (!formData.startTime) {
      setTimeError("Пожалуйста, выберите или укажите время начала");
      return;
    }
    if (manualTimeInput && !formData.endTime) {
      setTimeError("Пожалуйста, укажите время окончания");
      return;
    }
    // валидация ручного ввода времени...

    // Находим объект услуги по ID
    const svc = services.find((s) => s.id === formData.service);
    const serviceName = svc ? svc.service_name : "";

    const appointmentDateTime = `${formData.date} ${formData.startTime}`;
    const blockData = {
      title: formData.clientName
        ? `Запись: ${formData.clientName}`
        : "Запись клиента",
      service_name: serviceName, // <-- вместо service_id
      appointment_datetime: appointmentDateTime,
      start_time: appointmentDateTime,
      end_time: `${formData.date} ${formData.endTime}`,
      comment: formData.notes,
      client_name: formData.clientName,
      phone_number: formData.phone ? `+992${formData.phone}` : "",
    };


    onSubmit(blockData);
  };

  return (
    <div className="block-time-form-container">
      <div className="block-time-form">
        <div className="form-header">
          <h2>Запись клиента</h2>
          <button
            type="button"
            className="close-button"
            onClick={onCancel}
            aria-label="Закрыть"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {" "}
          {/* Имя клиента */}
          <div className="form-group">
            <label htmlFor="clientName">Имя клиента</label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              value={formData.clientName}
              onChange={handleChange}
              required
              placeholder="Введите имя клиента"
            />
          </div>
          {/* Номер телефона */}
          <div className="form-group">
            <label htmlFor="phone">Номер телефона</label>
            <div className="phone-input-container">
              <div className="phone-prefix">+992</div>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="XXXXXXXXX"
                maxLength="9"
                aria-describedby="phone-hint"
              />
            </div>
            <small id="phone-hint" className="form-hint">
              Введите 9 цифр номера без кода страны
            </small>
          </div>
          {/* Селект услуги */}
          <div className="form-group">
            <label htmlFor="service">Услуга</label>
            {servicesLoading ? (
              <p>Загрузка услуг...</p>
            ) : (
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              >
                <option value="">Выберите услугу</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.service_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Дата */}
          <div className="form-group">
            <label htmlFor="date">Дата</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          {/* Выводим выбранную дату в более дружественном формате */}
          <div className="selected-date">
            Выбрана дата:{" "}
            {new Date(formData.date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>{" "}
          {/* Слоты времени */}
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
              loading ? (
                <p>Загрузка интервалов...</p>
              ) : !formData.service ? (
                <p>Сначала выберите услугу</p>
              ) : timeSlotsToDisplay.length > 0 ? (
                <div className="available-time-slots">
                  {timeSlotsToDisplay.map((slot, idx) => (
                    <div
                      key={idx}
                      className={
                        "time-slot" +
                        (selectedTimeSlot === slot ? " selected" : "")
                      }
                      onClick={() => handleTimeSlotSelect(slot)}
                    >
                      <span className="slot-time">
                        {slot.start_time} – {slot.end_time}
                      </span>
                      <span className="slot-service">{slot.service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Нет доступных интервалов для этой услуги</p>
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
                      value={formData.startTime}
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
                      value={formData.endTime}
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
          </div>
          {/* Ошибка */}
          {timeError && (
            <div className="error-message" style={{ color: "red" }}>
              {timeError}
            </div>
          )}
          {/* Примечания */}
          <div className="form-group">
            <label htmlFor="notes">Примечания</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Дополнительная информация"
            />
          </div>
          {/* Кнопки */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="submit-btn">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BlockTimeForm;
