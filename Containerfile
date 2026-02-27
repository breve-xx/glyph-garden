# Containerfile for testing Vowel Like a Mac GNOME extension
#
# This sets up a Fedora 42 environment with GNOME 49 libraries
# for building, validating, and testing the extension.
#
# Usage from macOS:
#   docker build -t vowel-mac-dev -f Containerfile .
#   docker run -it vowel-mac-dev
#
# For GUI testing with a virtual display:
#   docker run -it -e DISPLAY=:99 vowel-mac-dev bash -c "Xvfb :99 &>/dev/null & sleep 1 && make lint && make build"

FROM fedora:42

# Install GNOME Shell, development tools, and testing dependencies
RUN dnf install -y \
    gnome-shell \
    glib2-devel \
    gjs \
    gjs-devel \
    libxml2 \
    make \
    zip \
    unzip \
    dbus-daemon \
    xorg-x11-server-Xvfb \
    && dnf clean all

WORKDIR /extension

# Copy extension source
COPY Makefile ./
COPY src/ ./src/

# Compile schemas and validate
RUN make build

# Default: run lint checks
CMD ["make", "lint"]
