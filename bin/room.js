class Room {
  constructor(code) {
    this.code = code;
    this.round = 1;
    this.deck = [];
    this.discard = [];
    this.team1 = { users: [], score: 0, isGuessing: false };
    this.team2 = { users: [], score: 0, isGuessing: false };
  }

  joinRoom() {
    const teamToJoin;
    if (this.team1.users.length() > this.team2.users.length())
    {
      teamToJoin = this.team2;
    } else if (this.team1.users.length() < this.team2.users.length())
    {
      teamToJoin = this.team1;
    } else {
      teamToJoin = Math.round(Math.random())[this.team1, this.team2];
    }
  }
}
