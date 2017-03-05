
cd /Users/sleroux/Library/LaunchAgents
launchctl load com.sleroux.parto.crawler.plist
launchctl unload com.sleroux.parto.crawler.plist


tail -f ~/Library/logs/ideo/parto/crawler.out
tail -f ~/Library/logs/ideo/parto/crawler.err
