# SMoH
Slot Machine of Holding

The SMoH exchanges your magic items for new ones.
The rarity of your prize is determined by the combined rarity of the items you offer. Each rarity tier (common, uncommon, rare, very rare, legendary) has a weighted value, so the more valuable your input, the greater your chances for a higher-tier reward.

## Requirements
### items.csv
Needs Input Items Data with headers "name", "type", "rarity". Ex Value: "Adamantine Armor, Armor, uncommon"

```shellsession
SMoH/data/items.csv
```

### archive.csv
Need an Archive csv to save results to.
```shellsession
SMoH/data/archive.csv
```

## Usage
Python script wrapped in Flask app. Run below and browse to: 127.0.0.1:5000
```shellsession
python3 app.py
```

## Known Issues
* not optimized for mobile
* archive.csv is not set up to accept mult input items causing funky read on archive html

## To Do:
* Add "Current Input Rarity Score" - cumulative score of input items
* Add "Prize Bucket" field - currently unlocked prize bucket based on input item rarity score
* Add "Current Input Item Count"
* Add "Jump to Bottom" and "Jump to Top" buttons to Archive page
