# pingdom-os-stats

For a really basic monitoring solution, create Pingdom Custom HTTP checks pointed at:

    /pingdom/memory
    /pingdom/load
    /pingdom/disk

The load endpoint shows the 5 minute average x 1000 since Pingdom doesn't understand values less than 1.

Place a thresholds.json in the root to configure thresholds:

```json
{
  "load": 2,
  "memory": 60,
  "disk": 50
}
```
