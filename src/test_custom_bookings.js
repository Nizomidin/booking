/**
 * Тесты для проверки функциональности кастомных бронирований
 */

// Мок данные для тестирования
const mockCustomBooking = {
  id: "123",
  client_name: "Тестовый Клиент",
  service_id: "456",
  service_name: "Окрашивание",
  appointment_datetime: "2023-05-15 14:30:00",
  start_time: "2023-05-15 14:30:00",
  end_time: "2023-05-15 16:00:00",
  comment: "Тестовый комментарий",
  status: "booked",
  is_custom: true
};

// Функция для проверки загрузки кастомных бронирований
async function testLoadCustomBookings() {
  try {
    console.log("Тест: Загрузка кастомных бронирований");
    const response = await fetch("https://api.kuchizu.online/custom_appointments");
    
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Загружено ${data.length} кастомных бронирований`);
    return true;
  } catch (error) {
    console.error("Тест не пройден:", error);
    return false;
  }
}

// Функция для проверки создания кастомного бронирования
async function testCreateCustomBooking() {
  try {
    console.log("Тест: Создание кастомного бронирования");
    
    const testData = {
      master_id: "789",
      client_name: "Тестовый Клиент",
      service_id: "456",
      appointment_datetime: "2023-05-15 14:30:00",
      start_time: "2023-05-15 14:30:00",
      end_time: "2023-05-15 16:00:00",
      comment: "Тестовое бронирование"
    };
    
    const response = await fetch("https://api.kuchizu.online/custom_appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка создания: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Бронирование создано:", data);
    return data.id;
  } catch (error) {
    console.error("Тест не пройден:", error);
    return null;
  }
}

// Функция для проверки обновления кастомного бронирования
async function testUpdateCustomBooking(id) {
  if (!id) return false;
  
  try {
    console.log(`Тест: Обновление кастомного бронирования ${id}`);
    
    const updateData = {
      comment: "Обновленный комментарий",
      start_time: "2023-05-15 15:00:00",
      end_time: "2023-05-15 16:30:00"
    };
    
    const response = await fetch(`https://api.kuchizu.online/custom_appointments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка обновления: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Бронирование обновлено:", data);
    return true;
  } catch (error) {
    console.error("Тест не пройден:", error);
    return false;
  }
}

// Функция для проверки удаления кастомного бронирования
async function testDeleteCustomBooking(id) {
  if (!id) return false;
  
  try {
    console.log(`Тест: Удаление кастомного бронирования ${id}`);
    
    const response = await fetch(`https://api.kuchizu.online/custom_appointments/${id}`, {
      method: "DELETE",
      headers: {
        accept: "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка удаления: ${response.status}`);
    }
    
    console.log("Бронирование удалено успешно");
    return true;
  } catch (error) {
    console.error("Тест не пройден:", error);
    return false;
  }
}

// Запуск всех тестов
async function runAllTests() {
  console.log("=== Начало тестирования кастомных бронирований ===");
  
  // Тест 1: Загрузка кастомных бронирований
  const loadResult = await testLoadCustomBookings();
  console.log(`Результат загрузки: ${loadResult ? "Успех" : "Неудача"}`);
  
  // Тест 2: Создание кастомного бронирования
  const createdId = await testCreateCustomBooking();
  console.log(`Результат создания: ${createdId ? "Успех" : "Неудача"}`);
  
  if (createdId) {
    // Тест 3: Обновление кастомного бронирования
    const updateResult = await testUpdateCustomBooking(createdId);
    console.log(`Результат обновления: ${updateResult ? "Успех" : "Неудача"}`);
    
    // Тест 4: Удаление кастомного бронирования
    const deleteResult = await testDeleteCustomBooking(createdId);
    console.log(`Результат удаления: ${deleteResult ? "Успех" : "Неудача"}`);
  }
  
  console.log("=== Окончание тестирования кастомных бронирований ===");
}

// Экспорт функций для использования в других модулях
export {
  testLoadCustomBookings,
  testCreateCustomBooking,
  testUpdateCustomBooking,
  testDeleteCustomBooking,
  runAllTests
};