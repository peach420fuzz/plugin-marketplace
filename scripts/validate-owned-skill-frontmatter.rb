#!/usr/bin/env ruby
# Parse actual authored YAML. Structural validity is not host or artistic acceptance.
require 'yaml'
require 'pathname'

def frontmatter(raw)
  match = raw.match(/\A---\r?\n(.*?)\r?\n---(?:\r?\n|\z)/m)
  raise ArgumentError, 'missing opening YAML frontmatter' unless match
  meta = YAML.safe_load(match[1], permitted_classes: [], permitted_symbols: [], aliases: false)
  raise ArgumentError, 'frontmatter must be a mapping' unless meta.is_a?(Hash)
  %w[name description].each do |key|
    raise ArgumentError, "nonblank string required: #{key}" unless meta[key].is_a?(String) && !meta[key].strip.empty?
  end
  meta
end

# Regression for the former unquoted description containing colon + space.
bad = "---\nname: review\ndescription: Reviews a whole: what is developed\n---\nBody\n"
begin
  frontmatter(bad)
  abort 'FAIL: unsafe unquoted colon description was accepted'
rescue Psych::SyntaxError
  # Expected YAML grammar failure; a frontmatter regex alone missed this defect.
end
good = "---\nname: review\ndescription: \"Reviews a whole: what is developed\"\n---\nBody\n"
raise 'quoted description regression' unless frontmatter(good)['description'] == 'Reviews a whole: what is developed'

root = Pathname.new(__dir__).parent
owned_roots = %w[plugins/remake-by-objekts external_plugins/remake-by-objekts plugins/skript-by-objekts external_plugins/skript-by-objekts]
paths = owned_roots.flat_map { |dir| Dir.glob(root.join(dir, 'skills', '*', 'SKILL.md').to_s) }.sort
abort 'FAIL: expected five existing owned source/adapter skills' unless paths.length == 5
paths.each do |path|
  meta = frontmatter(File.read(path, encoding: 'UTF-8'))
  raise "skill name/directory mismatch: #{path}" unless meta['name'] == File.basename(File.dirname(path))
end
puts "Skill YAML PASS: #{paths.length} actual files; 2 grammar regression cases. No host or artistic acceptance claimed."
