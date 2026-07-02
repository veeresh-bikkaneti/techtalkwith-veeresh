#!/usr/bin/env ruby
# frozen_string_literal: true

require "net/http"
require "uri"

POSTS_DIR = File.expand_path("../_posts", __dir__)
USER_AGENT = "Mozilla/5.0 (compatible; CitationChecker/1.0; +https://veeresh-bikkaneti.github.io/techtalkwith-veeresh/)"

def extract_source_urls(content)
  section = content.split(/## Sources & Further Reading/i, 2)[1]
  return [] unless section

  section.scan(%r{https?://[^\s)\]"'>]+})
end

TRANSIENT_ERRORS = [
  Net::OpenTimeout,
  Net::ReadTimeout,
  Errno::ETIMEDOUT,
  SocketError,
  EOFError
].freeze

def fetch_url(url)
  uri = URI.parse(url)
  return [url, :skip, "non-http"] unless uri.is_a?(URI::HTTP)

  Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 20, read_timeout: 20) do |http|
    request = Net::HTTP::Head.new(uri)
    request["User-Agent"] = USER_AGENT
    response = http.request(request)

    if response.code.to_i == 405 || response.code.to_i == 403
      request = Net::HTTP::Get.new(uri)
      request["User-Agent"] = USER_AGENT
      response = http.request(request)
    end

    code = response.code.to_i
    if code == 403 && uri.host&.include?("reddit.com")
      return [url, :ok, "403 (reddit bot wall)"]
    end

    status = code >= 200 && code < 400 ? :ok : :fail
    [url, status, code]
  end
end

def check_url(url, attempts: 3)
  fetch_url(url)
rescue *TRANSIENT_ERRORS => e
  if attempts > 1
    sleep 2
    return check_url(url, attempts: attempts - 1)
  end

  [url, :fail, e.message]
rescue StandardError => e
  [url, :fail, e.message]
end

urls = Dir.glob(File.join(POSTS_DIR, "*.md")).flat_map do |file|
  extract_source_urls(File.read(file))
end.uniq.sort

failures = []
urls.each do |url|
  _url, status, detail = check_url(url)
  if status == :ok
    puts "OK  #{url}"
  else
    puts "FAIL #{url} (#{detail})"
    failures << [url, detail]
  end
end

if failures.any?
  warn "\n#{failures.size} citation URL(s) failed:"
  failures.each { |url, detail| warn "  #{url} — #{detail}" }
  exit 1
end

puts "\nAll #{urls.size} citation URLs passed."