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
    this.phase = "waiting";
  }

  // adds user to team with less players, or a random team if player count is equal
  // return 0 if added to team1 and 1 if added to team2
  addUserToTeam(username) {
    if (this.team1.users.length === 0 && this.team2.users.length === 0) {
      console.log("Setting the room owner to:", username);
      this.roomOwner = username;
    }
    if (this.team1.users.length > this.team2.users.length) {
      this.team2.users.push(username);
      return 1;
    } else if (this.team1.users.length < this.team2.users.length) {
      this.team1.users.push(username);
      return 0;
    } else {
      const rand = Math.round(Math.random());
      if (rand == 0) {
        this.team1.users.push(username);
        return 0;
      } else {
        this.team2.users.push(username);
        return 1;
      }
    }
  }

  removeUser(username) {
    // Check which team the user is on and remove from team array
    for (let i = 0; i < this.team1.users.length; i++) {
      if (this.team1.users[i] === username) {
        this.team1.users.splice(i, 1);
      }
    }
    for (let j = 0; j < this.team2.users.length; j++) {
      if (this.team2.users[j] === username) {
        this.team1.users.splice(j, 1);
      }
    }
    // If the removed user was the room leader, pick another user to be leader
    if (this.roomOwner === username) {
      this.roomOwner = getRandomUser(this.team1.users, this.team2.users);
      console.log("New Room owner:", this.roomOwner);
    }
  }

  startGame() {
    // Randomly picks a team to go first and a user to be the clue giver
    this.phase = "submitting";
    const turnOrder = [];
    const rand = Math.round(Math.random());
    shuffle(this.team1.users);
    shuffle(this.team2.users);
    if (rand === 0) {
      turnOrder.push(0, 1);
      this.clueGiver = this.team1.users[0] || this.team2.users[0];
    } else {
      turnOrder.push(1, 0);
      this.clueGiver = this.team2.users[0] || this.team1.users[0];
    }
    console.log("the cluegiver is:", this.clueGiver);
  }

  scoreWord(teamIndex, word) {
    teamIndex === 0 ? this.team1.score++ : this.team2.score++;
    for (let i = 0; i < this.deck.length; i++) {
      if (this.deck[i].word === word) {
        const curWord = this.deck.splice(i, 1)[0];
        this.discard.push(curWord);
      }
    }
  }

  shuffleCards() {
    shuffle(this.deck);
  }
}

const getRandomUser = (teamArr1, teamArr2) => {
  const all_users = teamArr1.concat(teamArr2);
  const randomIndex = Math.floor(Math.random()) * all_users.length;
  return all_users[randomIndex];
};

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
