UUID = vowel-like-a-mac@gnome-extensions
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
SRC_DIR = src
SCHEMA_DIR = $(SRC_DIR)/schemas
SCHEMA_FILE = $(SCHEMA_DIR)/org.gnome.shell.extensions.vowel-like-a-mac.gschema.xml
DIST_FILES = $(SRC_DIR)/metadata.json $(SRC_DIR)/extension.js $(SRC_DIR)/prefs.js $(SRC_DIR)/stylesheet.css $(SRC_DIR)/schemas/

.PHONY: all build install uninstall package clean lint

all: build

build:
	glib-compile-schemas $(SCHEMA_DIR)

install: build
	mkdir -p $(EXTENSION_DIR)
	cp $(SRC_DIR)/metadata.json $(SRC_DIR)/extension.js $(SRC_DIR)/prefs.js $(SRC_DIR)/stylesheet.css $(EXTENSION_DIR)/
	cp -r $(SRC_DIR)/schemas $(EXTENSION_DIR)/
	@echo "Extension installed to $(EXTENSION_DIR)"
	@echo "Restart GNOME Shell (log out/in on Wayland) then enable with:"
	@echo "  gnome-extensions enable $(UUID)"

uninstall:
	rm -rf $(EXTENSION_DIR)
	@echo "Extension uninstalled."

package: build
	@mkdir -p dist
	cd $(SRC_DIR) && zip -r ../dist/$(UUID).zip metadata.json extension.js prefs.js stylesheet.css schemas/
	@echo "Package created: dist/$(UUID).zip"
	@echo "Install via: gnome-extensions install dist/$(UUID).zip"

clean:
	rm -f $(SCHEMA_DIR)/gschemas.compiled
	rm -rf dist/

lint:
	@echo "Checking JavaScript syntax..."
	@for f in $(SRC_DIR)/extension.js $(SRC_DIR)/prefs.js; do \
		node --check $$f 2>/dev/null && echo "  $$f: OK" || echo "  $$f: SYNTAX ERROR"; \
	done
	@echo "Validating metadata.json..."
	@python3 -c "import json; json.load(open('$(SRC_DIR)/metadata.json')); print('  metadata.json: OK')" 2>/dev/null || echo "  metadata.json: INVALID"
	@echo "Validating schema XML..."
	@xmllint --noout $(SCHEMA_FILE) 2>/dev/null && echo "  schema: OK" || echo "  schema: VALIDATION FAILED (xmllint not found or invalid)"
