module Jekyll
  module CustomTagFilter
    def phone_number(phone)
      phone = phone.to_s
      "(#{phone[1, 3]}) #{phone[4, 3]}-#{phone[7, 4]}"
    end
  end
end

Liquid::Template.register_filter(Jekyll::CustomTagFilter)
