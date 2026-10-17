import en from '../src/i18n/resources/en.json';
import hi from '../src/i18n/resources/hi.json';
import mr from '../src/i18n/resources/mr.json';

describe('Localization Resources', () => {
  it('contains essential translation sections across en, hi, mr', () => {
    const requiredSections = ['common', 'nav', 'auth', 'home', 'reels', 'create', 'chats', 'account', 'placeholder', 'errors'];

    for (const section of requiredSections) {
      expect(en).toHaveProperty(section);
      expect(hi).toHaveProperty(section);
      expect(mr).toHaveProperty(section);
    }
  });

  it('matches all navigation keys across languages', () => {
    const navKeys = Object.keys(en.nav);
    expect(Object.keys(hi.nav)).toEqual(navKeys);
    expect(Object.keys(mr.nav)).toEqual(navKeys);
  });
});
