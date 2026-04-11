use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "static/"]
pub struct Assets;

pub fn get_asset(path: &str) -> Option<(std::borrow::Cow<'static, [u8]>, String)> {
    let content = Assets::get(path)?;
    let mime_type = mime_guess::from_path(path).first_or_octet_stream().essence_str().to_string();
    Some((content.data, mime_type))
}