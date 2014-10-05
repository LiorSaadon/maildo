# Require any additional compass plugins here.

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "../ui/css"
sass_dir = "../ui/scss"
images_dir = "../ui/img"

# You can select your preferred output style here (can be overridden via the command line):
# output_style = :expanded or :nested or :compact or :compressed

# To enable relative paths to assets via compass helper functions. Uncomment:
# relative_assets = true

# To disable debugging comments that display the original location of your selectors. Uncomment:
 line_comments = false


http_images_path = "../app/assets/ui/img"

# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass

additional_import_paths = ["../../modules/mail/ui/scss",
                           "../../modules/tasks/ui/scss",
                           "../../core/frame/ui/scss",
                           "../ui/components/autoComplete/ui/scss",
                           "../ui/components/tags/ui/scss",
                           "../ui/components/dialog/ui/scss",
                           "../ui/components/search/ui/scss",
                           "../ui/scss"]
