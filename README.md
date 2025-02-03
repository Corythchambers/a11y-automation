# a11y accessiblity scanning
## MVP
User can enter a website and automation will recursively go through their webapp that is open to the public and log any accessibility issues it finds.

# Current issues:
- Recursion is dumb and will keep going possibly forever if there are unique urls (commerce sites will have a lot)
- - maybe the key is to limit how deep the test goes, maybe each tier is an extra $
- - Maybe a preliminary run can show how many pages we would scan before doing it, to intice users.
- ~ Format the report into a readable HTML file ~

## Future problems
- How will we access websites that have more protections
- How will we access websites behind VPN
- How will we access logged in users