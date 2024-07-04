import re
import json
from pathlib import Path

file = Path(__file__).parent / "spec.json"

file.write_text(re.sub(
    r"\[.*?\]",
    lambda m: json.dumps(sorted(json.loads(m.group()))),
    file.read_text(),
))
