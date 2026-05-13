const cardTemplate = document.querySelector("#card-template").content;

const getCardOwnerId = (cardData) => cardData.owner && cardData.owner._id;

const isOwnCard = (cardData, currentUserId) => {
  return getCardOwnerId(cardData) === currentUserId;
};

const isLikedByCurrentUser = (likes, currentUserId) => {
  return likes.some((user) => user._id === currentUserId);
};

const renderLikes = (likeButton, likeCounter, likes, currentUserId) => {
  likeCounter.textContent = likes.length;

  likeButton.classList.toggle(
    "card__like-button_is-active",
    isLikedByCurrentUser(likes, currentUserId)
  );
};

export const removeCardElement = (cardElement) => {
  cardElement.remove();
};

export const createCardElement = (
  cardData,
  currentUserId,
  { onPreviewPicture, onDeleteCard, onInfoClick, onLikeCard }
) => {
  const cardElement = cardTemplate.querySelector(".card").cloneNode(true);
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const deleteButton = cardElement.querySelector(".card__delete-button");
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCounter = cardElement.querySelector(".card__like-count");
  const infoButton = cardElement.querySelector(".card__info-button");

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardTitle.textContent = cardData.name;

  renderLikes(likeButton, likeCounter, cardData.likes || [], currentUserId);

  if (!isOwnCard(cardData, currentUserId)) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () => {
      onDeleteCard(cardElement, cardData._id);
    });
  }

  likeButton.addEventListener("click", () => {
    if (!onLikeCard) {
      likeButton.classList.toggle("card__like-button_is-active");
      return;
    }

    const isLiked = likeButton.classList.contains(
      "card__like-button_is-active"
    );

    onLikeCard(cardData._id, isLiked)
      .then((updatedCardData) => {
        renderLikes(
          likeButton,
          likeCounter,
          updatedCardData.likes || [],
          currentUserId
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });

  cardImage.addEventListener("click", () => {
    onPreviewPicture(cardData);
  });

  if (infoButton) {
    infoButton.addEventListener("click", () => {
      onInfoClick(cardData._id);
    });
  }

  return cardElement;
};