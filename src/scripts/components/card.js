import { changeLikeCardStatus, deleteCardFromServer } from "./api.js";

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  cardData,
  userId,
  { onPreviewPicture, onDeleteCard, onInfoClick }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const infoButton = cardElement.querySelector(".card__control-button_type_info");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCount = cardElement.querySelector(".card__like-count");

  infoButton.addEventListener("click", () => {
    onInfoClick(cardData._id);
  });

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardElement.querySelector(".card__title").textContent = cardData.name;
  likeCount.textContent = cardData.likes.length;

  // Если карточка лайкнута текущим пользователем — отметим кнопку
  if (cardData.likes.some((user) => user._id === userId)) {
    likeButton.classList.add("card__like-button_is-active");
  }

  // Иконка удаления показывается только у автора карточки
  if (cardData.owner._id !== userId) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () => {
      onDeleteCard(cardElement, cardData._id);
    });
  }

  // Лайк / снятие лайка
  likeButton.addEventListener("click", () => {
    const isLiked = likeButton.classList.contains("card__like-button_is-active");
    changeLikeCardStatus(cardData._id, isLiked)
      .then((updatedCard) => {
        likeButton.classList.toggle("card__like-button_is-active");
        likeCount.textContent = updatedCard.likes.length;
      })
      .catch((err) => {
        console.log(err);
      });
  });

  // Открытие полноразмерного изображения
  cardImage.addEventListener("click", () => {
    onPreviewPicture({ name: cardData.name, link: cardData.link });
  });

  return cardElement;
};
