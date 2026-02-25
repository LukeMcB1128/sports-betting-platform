# Base game layout follows:

```
Game[] = [
  {
    id: '',
    sport: '',
    league: '',
    awayTeam: '',
    homeTeam: '',
    startTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: '',
    odds: {
      moneyline: { away: , home: },
      spread: {
        away: { line: , juice:  },
        home: { line: , juice:  },
      },
    },
  },
```

# Explanation
- ID is the number in list
- Sport is the sport being played, think football, soccer, etc
- League will almost always be AISD(6A D1/2 and others), however playoffs and other events will be noted there
- Note: Name should always be school name, for example: Akins instead of Akins Eagles
- Away team will be away for the venue
- Home is home for the venue
- Start time is indicated in AM/PM CDT
- Status will be one of the items in this list: [Upcoming, Postponed, Live, Resolving, Finished]
- Odds are determined by admin in the admin portal. These are determined by assessment of each team OR an algothrim if there is sufficient info.

# Usage
- This is a generic layout that will be instantiated whenever a admin creates a game in the portal
- Games may be instantiated before odds are made