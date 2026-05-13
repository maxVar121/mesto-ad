import { createCardElement, removeCardElement } from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addNewCard,
  deleteCardFromServer,
} from "./components/api.js";

// Настройки валидации
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// DOM узлы
const placesWrap = document.querySelector(".places__list");

const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description"
);

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input_type_avatar");

const confirmDeleteModalWindow = document.querySelector(
  ".popup_type_remove-card"
);
const confirmDeleteForm = confirmDeleteModalWindow.querySelector(".popup__form");

const infoModalWindow = document.querySelector(".popup_type_info");
const infoList = infoModalWindow.querySelector(".popup__info");
const infoUsersList = infoModalWindow.querySelector(".popup__list");
const infoDefinitionTemplate = document.querySelector(
  "#popup-info-definition-template"
);
const infoUserPreviewTemplate = document.querySelector(
  "#popup-info-user-preview-template"
);

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

// Текущий пользователь и состояние удаления
let currentUserId = null;
let cardToDelete = null;

// Утилита: меняет текст кнопки на время запроса
const renderLoading = (button, isLoading, defaultText, loadingText) => {
  button.textContent = isLoading ? loadingText : defaultText;
};

// Форматирование даты вида "ДД месяц ГГГГ" на русском
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Создание строки списка "термин — описание" для модалки информации
const createInfoDefinition = (term, description) => {
  const fragment = infoDefinitionTemplate.content.cloneNode(true);
  fragment.querySelector(".popup__info-term").textContent = term;
  fragment.querySelector(".popup__info-description").textContent = description;
  return fragment;
};

// Создание элемента списка лайкнувших пользователей
const createUserPreview = (userName) => {
  const fragment = infoUserPreviewTemplate.content.cloneNode(true);
  fragment.querySelector(".popup__list-item").textContent = userName;
  return fragment;
};

// Открытие модалки с информацией о карточке
const handleInfoClick = (cardId) => {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) return;

      infoList.replaceChildren(
        createInfoDefinition("Описание:", cardData.name),
        createInfoDefinition(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        ),
        createInfoDefinition("Владелец:", cardData.owner.name)
      );

      infoUsersList.replaceChildren(
        ...cardData.likes.map((user) => createUserPreview(user.name))
      );

      openModalWindow(infoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Открытие полноразмерной картинки
const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

// Запрос подтверждения удаления карточки
const handleDeleteRequest = (cardElement, cardId) => {
  cardToDelete = {
    element: cardElement,
    id: cardId,
  };

  openModalWindow(confirmDeleteModalWindow);
};

// Подтверждение удаления карточки
const handleConfirmDeleteSubmit = (evt) => {
  evt.preventDefault();

  if (!cardToDelete) return;

  const submitButton = confirmDeleteForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Да", "Удаление...");

  deleteCardFromServer(cardToDelete.id)
    .then(() => {
      removeCardElement(cardToDelete.element);
      cardToDelete = null;
      closeModalWindow(confirmDeleteModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Да", "Удаление...");
    });
};

// Сабмит формы профиля
const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = profileForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Сохранить", "Сохранение...");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Сохранить", "Сохранение...");
    });
};

// Сабмит формы аватара
const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = avatarForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Сохранить", "Сохранение...");

  setUserAvatar({
    avatar: avatarInput.value,
  })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Сохранить", "Сохранение...");
    });
};

// Сабмит формы новой карточки
const handleCardFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = cardForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Создать", "Создание...");

  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((newCardData) => {
      placesWrap.prepend(
        createCardElement(newCardData, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onDeleteCard: handleDeleteRequest,
          onInfoClick: handleInfoClick,
        })
      );

      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Создать", "Создание...");
    });
};

// Слушатели сабмитов форм
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
confirmDeleteForm.addEventListener("submit", handleConfirmDeleteSubmit);

// Открытие модалки редактирования профиля
openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;

  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

// Открытие модалки обновления аватара
profileAvatar.addEventListener("click", () => {
  avatarForm.reset();

  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

// Открытие модалки добавления карточки
openCardFormButton.addEventListener("click", () => {
  cardForm.reset();

  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

// Настройка обработчиков закрытия попапов
const allPopups = document.querySelectorAll(".popup");

allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Включение валидации
enableValidation(validationSettings);

// Загрузка данных пользователя и карточек с сервера
Promise.all([getUserInfo(), getCardList()])
  .then(([userData, cards]) => {
    currentUserId = userData._id;

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onDeleteCard: handleDeleteRequest,
          onInfoClick: handleInfoClick,
        })
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });