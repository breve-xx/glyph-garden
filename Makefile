UUID = glyph-garden@breve-xx.github.io
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
SRC_DIR = src
SCHEMA_DIR = $(SRC_DIR)/schemas
SCHEMA_FILE = $(SCHEMA_DIR)/org.gnome.shell.extensions.glyph-garden.gschema.xml
DIST_FILES = metadata.json extension.js core.js prefs.js stylesheet.css schemas/

.PHONY: all build install uninstall package clean lint test

all: build

build:
	glib-compile-schemas $(SCHEMA_DIR)

install: build
	mkdir -p $(EXTENSION_DIR)
	cp -r $(addprefix $(SRC_DIR)/,$(DIST_FILES)) $(EXTENSION_DIR)/
	@echo "Extension installed to $(EXTENSION_DIR)"
	@echo "Restart GNOME Shell (log out/in on Wayland) then enable with:"
	@echo "  gnome-extensions enable $(UUID)"

uninstall:
	rm -rf $(EXTENSION_DIR)
	@echo "Extension uninstalled."

package: build
	@mkdir -p dist
	cd $(SRC_DIR) && zip -r ../dist/$(UUID).zip $(DIST_FILES)
	@echo "Package created: dist/$(UUID).zip"
	@echo "Install via: gnome-extensions install dist/$(UUID).zip"

clean:
	rm -f $(SCHEMA_DIR)/gschemas.compiled
	rm -rf dist/

lint:
	@echo "Checking JavaScript syntax..."
	@for f in $(addprefix $(SRC_DIR)/,$(filter %.js,$(DIST_FILES))); do \
		node --check $$f 2>/dev/null && echo "  $$f: OK" || echo "  $$f: SYNTAX ERROR"; \
	done
	@echo "Validating metadata.json..."
	@python3 -c "import json; json.load(open('$(SRC_DIR)/metadata.json')); print('  metadata.json: OK')" 2>/dev/null || echo "  metadata.json: INVALID"
	@echo "Validating schema XML..."
	@xmllint --noout $(SCHEMA_FILE) 2>/dev/null && echo "  schema: OK" || echo "  schema: VALIDATION FAILED (xmllint not found or invalid)"

test: build
	gjs -m tests/run-all.js
