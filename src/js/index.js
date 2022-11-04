import FriendsList from "./FriendsList";
import arrowIcon from "../assets/arrow.svg";

import "../loader.css";
import "../style.scss";

const allSearchInput = document.querySelector(
  ".search-bar-all .search-bar__input"
);

const addedSearchInput = document.querySelector(
  ".search-bar-added .search-bar__input"
);

const allFriendsList = new FriendsList(
  document.querySelector(".friends-all .friends__list"),
  {
    onButtonClick: allFriendsButtonClickHandler,
    buttonIcon: arrowIcon,
    loaderSelector: ".friends-all .friends__loader",
  }
);
const addedFriendsList = new FriendsList(
  document.querySelector(".friends-added .friends__list"),
  {
    onFriendAdded: friendsChangedHandler,
    onFriendRemoved: friendsChangedHandler,
    onButtonClick: addedFriendsButtonClickHandler,
    loaderSelector: ".friends-added .friends__loader",
  }
);

let id;

init();

async function init() {
  VK.init({
    apiId: 51467949,
  });

  allFriendsList.isLoading = true;
  addedFriendsList.isLoading = true;

  try {
    const data = await auth();
    id = data.mid;
  } catch (error) {
    console.error(error);
    return;
  }

  const addedFriendsIds = await loadAddedFriends();
  const res = await getFriends();

  try {
    await Promise.all(
      res.items.map(async (id) => {
        if (addedFriendsIds.includes(id)) return;

        const user = await getUserById(id);
        allFriendsList.addFriend(serializeUserData(user));
      })
    );
  } finally {
    allFriendsList.isLoading = false;
  }

  try {
    await Promise.all(
      addedFriendsIds.map(async (id) => {
        const user = await getUserById(id);
        addedFriendsList.addFriend(serializeUserData(user));
      })
    );
  } finally {
    addedFriendsList.isLoading = false;
  }

  allSearchInput.addEventListener("input", allSearchInputInputHandler);
  addedSearchInput.addEventListener("input", addedSearchInputInputHandler);
}

async function auth() {
  return new Promise((res) => {
    VK.Auth.login((data) => {
      if (data.session) {
        res(data);
      } else {
        throw new Error("Failed to authorize");
      }
    });
  });
}

async function callAPI(method, params = {}) {
  params.v = "5.81";

  return new Promise((res) => {
    VK.api(method, params, (data) => {
      if (!data.error) {
        res(data.response);
      } else {
        throw new Error(data.error.error_msg);
      }
    });
  });
}

async function getFriends() {
  return callAPI("friends.get");
}

async function getUserById(id) {
  return (await callAPI("users.get", { user_id: id, fields: "photo_100" }))[0];
}

function serializeUserData(data) {
  return {
    id: data.id,
    image: data.photo_100,
    name: `${data.first_name} ${data.last_name}`,
  };
}

function saveAddedFriends() {
  const friends = addedFriendsList.getFriends();
  const ids = friends.map((friend) => friend.id);

  localStorage.setItem(id, JSON.stringify(ids));
}

async function loadAddedFriends() {
  const item = localStorage.getItem(id);
  if (!item) return [];

  let ids = [];

  try {
    ids = JSON.parse(item);
  } catch (error) {
    console.error("Failed to parse data");
  }

  return ids;
}

function friendsChangedHandler() {
  saveAddedFriends();
}

function allFriendsButtonClickHandler(friend) {
  allFriendsList.removeFriend(friend.id);
  addedFriendsList.addFriend(friend);
}

function addedFriendsButtonClickHandler(friend) {
  addedFriendsList.removeFriend(friend.id);
  allFriendsList.addFriend(friend);
}

function allSearchInputInputHandler(e) {
  allFriendsList.currentFilter = e.target.value;
}

function addedSearchInputInputHandler(e) {
  addedFriendsList.currentFilter = e.target.value;
}
