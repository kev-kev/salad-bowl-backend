class Room {
  constructor(code) {
    this.code = code;
    this.round = 1;
    this.deck = [];
    this.discard = [];
    this.team1 = { users: [], score: 0, isGuessing: false };
    this.team2 = { users: [], score: 0, isGuessing: false };
    this.roomOwner = null;
    this.clueGiver = null;
    this.gameInProgress = false;
  }

  // adds user to team with less players, or a random team if player count is equal
  addUserToTeam(user) {
    if (this.team1.users.length === 0 && this.team2.users.length === 0) {
      console.log("setting roomOwner to", user.name);
      this.roomOwner = user.name;
    }
    if (this.team1.users.length > this.team2.users.length) {
      console.log("less in team 2");
      this.team2.users.push(user);
    } else if (this.team1.users.length < this.team2.users.length) {
      this.team1.users.push(user);
    } else {
      const rand = Math.round(Math.random());
      rand == 0 ? this.team1.users.push(user) : this.team2.users.push(user);
    }
  }

  startGame() {
    // Randomly pick a team to go first, then a user to be the clue giver
    this.gameInProgress = true;
    const turnOrder = [];
    const rand = Math.round(Math.random());
    rand === 0 ? turnOrder.push(0, 1) : turnOrder.push(1, 0);
    shuffle(this.team1.users);
    shuffle(this.team2.users);
  }

  removeUser(username) {
    // Check which team the user is on and
    for (let i = 0; i < this.team1.users.length; i++) {
      if (this.team1.users[i].username === username) {
        this.team1.users.splice(i, 1);
      }
    }
    for (let j = 0; j < this.team2.users.length; j++) {
      if (this.team2.users[j].username === username) {
        this.team1.users.splice(j, 1);
      }
    }
  }

  checkIfValidName(username) {
    // Returns false if name isn't present or unqique (non-case sensitive)
    if (username.length < 1) {
      return false;
    }
    username = username.toLowerCase();
    const len = Math.max(room.team1.users.length, room.team2.users.length);
    for (let i = 0; i < len; i++) {
      if (room.team1.users[i]) {
        if (room.team1.users[i].name.toLowerCase() === username) {
          return false;
        }
      }
      if (room.team2.users[i]) {
        if (room.team2.users[i].name.toLowerCase() === username) {
          return false;
        }
      }
    }
    return true;
  }
}

// in place fisher-yates shuffle
const shuffle = (arr) => {
  let lastIndex = arr.length - 1;
  for (i = 0; i < lastIndex; i++) {
    const randomIndex = Math.floor(Math.random() * i);
    if (randomIndex !== i) {
      const temp = arr[i];
      arr[i] = arr[randomIndex];
      arr[randomIndex] = temp;
    }
  }
  return arr;
};

module.exports = {
  Room,
};
