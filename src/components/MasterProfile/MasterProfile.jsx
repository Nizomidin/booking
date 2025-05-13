import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./MasterProfile.css";
import MasterCalendar from "./MasterCalendar";
import BookingDetails from "./BookingDetails";
import BlockTimeForm from "./BlockTimeForm";
import WorkScheduleForm from "./WorkScheduleForm";
import MasterBookingManager from "./MasterBookingManager";
import ServiceManager from "./ServiceManager";
import { useToast } from "../Toast/ToastContext";

const API_BASE = "https://api.kuchizu.online";

// Компонент фото мастера с запасным вариантом, если фото нет
const MasterPhoto = ({ photoUrl, name }) => {
  const [hasError, setHasError] = useState(false);
  const fullPhotoUrl = photoUrl ? `${API_BASE}${photoUrl}` : '../public/logo.jpg';

  return (
    <div className="master-photo-container">
      {!hasError && fullPhotoUrl ? (
        <img 
          src={fullPhotoUrl} 
          alt={name} 
          className="master-photo" 
          onError={() => setHasError(true)}
        />
      ) : (
        <img 
          src={process.env.PUBLIC_URL + "/logo.jpg"} 
          alt={name} 
          className="master-photo" 
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

function MasterProfile() {
  const { masterId } = useParams(); // Получаем ID мастера из URL
  const [masterData, setMasterData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [error, setError] = useState(null);
  const [isDayOff, setIsDayOff] = useState(false); // Новое состояние для отслеживания выходного дня
  const [showBlockTimeForm, setShowBlockTimeForm] = useState(false);
  const [showWorkScheduleForm, setShowWorkScheduleForm] = useState(false);
  const [showBookingManager, setShowBookingManager] = useState(false);
  const [view, setView] = useState("calendar"); // 'calendar', 'details', 'booking-manager' или 'services'
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false); // Состояние для проверки, является ли пользователь администратором компании
  const { showSuccess, showError } = useToast(); // Получаем функции для показа тостов

  useEffect(() => {
    // Загрузка данных мастера
    const fetchMasterData = async () => {
      try {
        if (!masterId) {
          throw new Error("Не удалось определить ID мастера");
        }
        console.log('url', `${API_BASE}/masters/${masterId}`)
        const res = await fetch(`${API_BASE}/masters/${masterId}`, {
          headers: {
            accept: "application/json"
          },
        });

        if (!res.ok) throw new Error("Не удалось загрузить данные мастера");

        const data = await res.json();
        setMasterData(data);

        // Проверяем, является ли текущий пользователь администратором компании
        if (data.company_id) {
          await checkIsCompanyAdmin(data.company_id);
        }

        // Загружаем доступное время мастера на текущую дату
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Формат YYYY-MM-DD
        await fetchAvailableTimes(masterId, formattedDate);
      } catch (err) {
        console.error("Ошибка при загрузке данных мастера:", err);
        setError(err.message);
      }
    };

    fetchMasterData();
  }, [masterId]);

  // Функция для проверки, является ли текущий пользователь админом компании
  const checkIsCompanyAdmin = async (companyId) => {
    try {
      // Получаем информацию о компании
      const res = await fetch(`${API_BASE}/companies/${companyId}`, {
        headers: {
          accept: "application/json"
        }
      });

      if (!res.ok) throw new Error("Не удалось получить информацию о компании");

      const companyData = await res.json();
            
      // Проверяем, является ли текущий пользователь администратором компании
      if (masterId && companyData.admin_id && masterId === companyData.admin_id) {
        setIsCompanyAdmin(true);
        console.log("Пользователь является администратором компании");
      } else {
        setIsCompanyAdmin(false);
        console.log("Пользователь не является администратором компании", {
          masterId,
          adminId: companyData.admin_id
        });
      }
    } catch (err) {
      console.error("Ошибка при проверке администратора компании:", err);
      setIsCompanyAdmin(false);
    }
  };

  // Загрузка доступного времени мастера
  const fetchAvailableTimes = async (masterId, date) => {
    try {
      // Используем правильный формат URL для API
      const res = await fetch(`${API_BASE}/masters/${masterId}/available?date=${date}`, {
        headers: {
          accept: "application/json"
        },
      });

      if (!res.ok) {
        // Проверяем, если это ошибка о выходном дне
        const errorData = await res.json();
        
        if ((res.status === 404 || res.status === 400) && 
            errorData.detail && 
            (errorData.detail.includes("master is off on this day") || 
             errorData.detail.includes("HTTPException(404, 'master is off on this day')"))) {
          // Устанавливаем флаг выходного дня
          setBookings([]);
          setIsDayOff(true); // Устанавливаем флаг выходного дня
          setError(null); // Сбрасываем обычную ошибку
          console.log("У мастера выходной в этот день");
          return;
        }
        throw new Error("Не удалось загрузить доступное время");
      }

      const data = await res.json();
      // Обрабатываем полученные данные о доступном времени
      setBookings(data.available_times || []);
      setIsDayOff(false); // Сбрасываем флаг выходного дня
      setError(null); // Сбрасываем ошибку, если она была
    } catch (err) {
      console.error("Ошибка при загрузке доступного времени:", err);
      setError(err.message);
      setIsDayOff(false); // Сбрасываем флаг выходного дня при других ошибках
    }
  };

  // Загрузка записей мастера
  const fetchBookings = async (masterId) => {
    try {
      const res = await fetch(`${API_BASE}/masters/${masterId}/bookings`, {
        headers: {
          accept: "application/json"
        },
      });

      if (!res.ok) throw new Error("Не удалось загрузить записи");

      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Ошибка при загрузке записей:", err);
      setError(err.message);
    }
  };

  // Функция обновления данных для текущего выбранного дня
  const refreshCurrentDayData = () => {
    // Форматируем текущую выбранную дату в формат YYYY-MM-DD для API
    const formattedDate = selectedDate.toISOString().split('T')[0];
    // Загружаем актуальные данные
    fetchAvailableTimes(masterId, formattedDate);
  };
  // Обработчик удаления записи
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) {
      return;
    }

    try {
      // Определяем, является ли это кастомным бронированием
      const isCustom = selectedBooking && selectedBooking.is_custom;
      
      // Выбираем нужный эндпоинт в зависимости от типа бронирования
      const endpoint = isCustom 
        ? `${API_BASE}/custom_appointments/${bookingId}` 
        : `${API_BASE}/appointments/${bookingId}`;
        
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          accept: "application/json"
        },
      });

      if (!res.ok) throw new Error(`Не удалось удалить запись (${res.status})`);

      // Если это была выбранная запись, сбрасываем выбор
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(null);
        setView("calendar");
      }
      
      showSuccess("Запись успешно удалена");
      
      // Автоматическое обновление страницы
      window.location.reload();
    } catch (err) {
      console.error("Ошибка при удалении записи:", err);
      showError(`Ошибка при удалении записи: ${err.message}`);
    }
  };
  // Обработчик изменения времени записи
  const handleUpdateBooking = async (bookingId, updatedData) => {
    try {
      // Определяем, является ли это кастомным бронированием
      const isCustom = updatedData.is_custom;
      // Удаляем флаг из данных перед отправкой на сервер
      if (isCustom) {
        delete updatedData.is_custom;
      }
      
      // Выбираем нужный эндпоинт в зависимости от типа бронирования
      const endpoint = isCustom 
        ? `${API_BASE}/custom_appointments/${bookingId}` 
        : `${API_BASE}/appointments/${bookingId}`;
      
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error(`Не удалось обновить запись (${res.status})`);

      const updatedBooking = await res.json();
      // Обновляем выбранную запись, если она была изменена
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(updatedBooking);
      }

      showSuccess("Запись успешно обновлена");
      
      // Автоматическое обновление страницы
      window.location.reload();
    } catch (err) {
      console.error("Ошибка при обновлении записи:", err);
      showError(`Ошибка при обновлении записи: ${err.message}`);
    }
  };

  // Обработчик блокировки времени (личная запись мастера)
  const handleBlockTime = async (blockData) => {
    try {
      const res = await fetch(`${API_BASE}/custom_appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({
          ...blockData,
          master_id: masterId,
        }),
      });

      if (!res.ok) throw new Error("Не удалось забронировать время");

      setShowBlockTimeForm(false);
      showSuccess("Время успешно забронировано");
      
      // Автоматически обновляем страницу для отображения актуальных данных
      window.location.reload();
    } catch (err) {
      console.error("Ошибка при брони времени:", err);
      showError(`Ошибка при брони времени: ${err.message}`);
    }
  };

  // Функция выбора записи для просмотра деталей
  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setView("details");
  };

  // Обработчик переключения на менеджер бронирования других мастеров
  const handleToggleBookingManager = () => {
    if (view === "booking-manager") {
      // Если уже на вкладке менеджера, возвращаемся к календарю
      setView("calendar");
    } else {
      // Иначе переключаемся на менеджер бронирований
      setView("booking-manager");
    }
  };

  // Обновленный обработчик изменения даты в календаре
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // Форматируем дату в YYYY-MM-DD для API
    const formattedDate = newDate.toISOString().split('T')[0];
    // Загружаем данные о доступном времени для выбранной даты
    fetchAvailableTimes(masterId, formattedDate);
  };

  // Возврат к календарю из деталей записи
  const handleBackToCalendar = () => {
    setView("calendar");
    setSelectedBooking(null);
  };

  if (error) {
    return <div className="master-profile error">Ошибка: {error}</div>;
  }

  if (!masterData) {
    return (
      <div className="master-profile loading">
        Загрузка данных...
      </div>
    );
  }

  return (
    <div className="master-profile">
      <div className="master-header">
        <div className="master-info-container">
          <MasterPhoto 
            photoUrl={masterData.photo_url} 
            name={`${masterData.first_name} ${masterData.last_name}`} 
          />
          <div className="master-info">
            <h2>
              {masterData.first_name} {masterData.last_name}
            </h2>
            <p className="service-category">{masterData.service_category}</p>
            <div className="master-contacts">
              {masterData.telegram_username && (
                <p className="contact-info">
                  <span className="contact-label">Telegram:</span> {masterData.telegram_username}
                </p>
              )}
              {masterData.phone_number && (
                <p className="contact-info">
                  <span className="contact-label">Телефон:</span> {masterData.phone_number}
                </p>
              )}
              {masterData.address && (
                <p className="contact-info">
                  <span className="contact-label">Адрес:</span> {masterData.address}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="master-actions">
          <button
            className="block-time-btn"
            onClick={() => setShowBlockTimeForm(true)}
          >
            Забронировать время
          </button>
          <button
            className="work-schedule-btn"
            onClick={() => setShowWorkScheduleForm(true)}
          >
            Редактировать график работы
          </button>
          <button
            className={`services-btn ${view === "services" ? "active" : ""}`}
            onClick={() => setView(view === "services" ? "calendar" : "services")}
          >
            {view === "services" ? "Вернуться к календарю" : "Управление услугами"}
          </button>
          {isCompanyAdmin && (
            <button
              className={`book-master-btn ${view === "booking-manager" ? "active" : ""}`}
              onClick={handleToggleBookingManager}
            >
              {view === "booking-manager" ? "Вернуться к календарю" : "Запись к другим мастерам"}
            </button>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <div className="calendar-container">
          <MasterCalendar
            bookings={bookings}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onSelectBooking={handleSelectBooking}
            isDayOff={isDayOff} // Передаем информацию о выходном дне
            master_id={masterId}
          />
        </div>
      ) : view === "details" ? (
        <div className="booking-details-container">
          <BookingDetails
            booking={selectedBooking}
            onBack={handleBackToCalendar}
            onDelete={handleDeleteBooking}
            onUpdate={handleUpdateBooking}
            masterId={masterId}
          />
        </div>
      ) : view === "services" ? (
        <div className="services-container">
          <ServiceManager masterId={masterId} />
        </div>
      ) : (
        <div className="booking-manager-container">
          <MasterBookingManager 
            currentMasterId={masterId} 
          />
        </div>
      )}

      {showBlockTimeForm && (
        <div className="overlay">
          <BlockTimeForm
            onSubmit={handleBlockTime}
            onCancel={() => setShowBlockTimeForm(false)}
            selectedDate={selectedDate}
            masterId={masterId}
          />
        </div>
      )}

      {showWorkScheduleForm && (
        <div className="overlay">
          <WorkScheduleForm
            masterId={masterId}
            onCancel={() => setShowWorkScheduleForm(false)}
          />
        </div>
      )}
    </div>
  );
}

export default MasterProfile;
