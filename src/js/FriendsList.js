import { createElementEx } from "./utils";

import closeIcon from "../assets/close.svg";

export default class FriendsList {
  static friendsLists = {};
  static currentId = 0;

  constructor(listRoot, options = {}) {
    if (!(listRoot instanceof HTMLElement)) {
      throw new Error("Root must be a HTMLElement");
    }

    this.root = listRoot;
    this.options = options;
    this.friends = [];

    this._isLoading = false;
    this._currentFilter = "";

    if (typeof options.loaderSelector === "string") {
      this.loaderElement = document.querySelector(options.loaderSelector);

      if (!this.loaderElement) {
        throw new Error("Loader is undefined");
      }

      this.loaderElement.style.display = "none";
    }

    this.root.addEventListener("drop", this.onDrop.bind(this));
    this.root.addEventListener("dragover", (e) => e.preventDefault());

    this.id = FriendsList.currentId;
    FriendsList.friendsLists[FriendsList.currentId] = this;
    FriendsList.currentId++;
  }

  get currentFilter() {
    return this._currentFilter;
  }

  set currentFilter(filter) {
    if (typeof filter !== "string") return;

    this._currentFilter = filter;
    this.render();
  }

  get isLoading() {
    return this._isLoading;
  }

  set isLoading(value) {
    this._isLoading = value;

    if (!this.loaderElement) return;

    if (value) {
      this.loaderElement.style.display = "block";
      this.root.style.display = "none";

      return;
    }

    this.loaderElement.style.display = "none";
    this.root.style.display = "block";
  }

  destroy() {
    this.friends = [];

    delete this.friendsLists[this.id];
  }

  onDrop(e) {
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;

    const { listId, friend } = JSON.parse(data);
    if (listId === this.id) return;

    const list = FriendsList.getListById(listId);

    list.removeFriend(friend.id);
    this.addFriend(friend);
  }

  onButtonClick(friend) {
    if (typeof this.options.onButtonClick === "function") {
      this.options.onButtonClick(friend);

      return;
    }

    this.removeFriend(friend.id);
  }

  buildItem(friend) {
    const item = createElementEx("li", "friends-list-item");
    item.draggable = true;

    const friendElem = createElementEx("div", "friend");
    const img = createElementEx("img", "friend__image");
    const name = createElementEx("div", "friend__name");
    const btn = createElementEx("button", "friend__btn btn");
    const btnIcon = createElementEx("img", "friend__btn-icon");

    img.src = friend.image;
    img.alt = "Friend image";

    name.textContent = friend.name;

    btnIcon.src = this.options.buttonIcon || closeIcon;

    btn.addEventListener("click", () => {
      this.onButtonClick(friend);
    });

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          listId: this.id,
          friend,
        })
      );
    });

    btn.append(btnIcon);
    friendElem.append(img, name, btn);
    item.append(friendElem);

    return item;
  }

  render() {
    if (this._renderTimer) {
      clearInterval(this._renderTimer);
    }

    this.root.innerHTML = "";

    const filtered = this.friends.filter((friend) => {
      const name = friend.name.toLocaleLowerCase();

      if (!this.currentFilter) return true;

      const filter = this.currentFilter.toLocaleLowerCase();
      return name.includes(filter);
    });

    let current = 0;
    const renderPerTick = 50;
    const delay = 100;
    this._renderTimer = setInterval(() => {
      if (current >= filtered.length) {
        clearInterval(this._renderTimer);
        return;
      }

      const items = [];
      const length = Math.min(current + renderPerTick, filtered.length);
      for (let i = current; i < length; i++) {
        const friend = filtered[i];
        const item = this.buildItem(friend);
        items.push(item);
      }

      this.root.append(...items);
      current += renderPerTick;
    }, delay);
  }

  addFriend(friend) {
    this.friends.push(friend);

    this.render();

    if (typeof this.options.onFriendAdded === "function") {
      this.options.onFriendAdded(friend);

      return;
    }
  }

  removeFriend(id) {
    const friend = this.friends.find((friend) => friend.id === id);
    if (!friend) return;

    this.friends = this.friends.filter((friend) => friend.id !== id);
    this.render();

    if (typeof this.options.onFriendRemoved === "function") {
      this.options.onFriendRemoved(friend);

      return;
    }
  }

  getFriends() {
    return this.friends;
  }

  static getListById(id) {
    return FriendsList.friendsLists[id];
  }
}
