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
      console.log("Setting the room owner to:", user);
      this.roomOwner = user.name;
    }
    if (this.team1.users.length > this.team2.users.length) {
      this.team2.users.push(user);
    } else if (this.team1.users.length < this.team2.users.length) {
      this.team1.users.push(user);
    } else {
      const rand = Math.round(Math.random());
      rand == 0 ? this.team1.users.push(user) : this.team2.users.push(user);
    }
  }

  removeUser(username) {
    // Check which team the user is on and
    for (let i = 0; i < this.team1.users.length; i++) {
      if (this.team1.users[i].name === username) {
        this.team1.users.splice(i, 1);
      }
    }
    for (let j = 0; j < this.team2.users.length; j++) {
      if (this.team2.users[j].name === username) {
        this.team1.users.splice(j, 1);
      }
    }
    if (this.roomOwner === username) {
      this.roomOwner = getRandomUser(this.team1.users, this.team2.users);
      console.log("New Room owner:", this.roomOwner);
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
}

const getRandomUser = (team1, team2) => {
  const users = team1.concat(team2);
  const randomIndex = Math.floor(Math.random()) * users.length;
  return users[randomIndex].name;
};

// in place fisher-yates shuffle
const shuffle = (arr) => {
  let lastIndex = arr.length - 1;
  for (i = 0; i < lastIndex; i++) {
    const randomIndex = Math.round(Math.random() * i);
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
