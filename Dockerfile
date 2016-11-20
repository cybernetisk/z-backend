FROM python:3-slim
MAINTAINER Henrik Steen <henrist@henrist.net>

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
           texlive \
           texlive-latex-base \
           texlive-latex-extra \
           texlive-latex-recommended \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app

COPY app/requirements.txt /usr/src/app/

WORKDIR /usr/src/app
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
CMD ["/start.sh"]

COPY container/start.sh /start.sh
COPY container/gunicorn.conf /gunicorn.conf
COPY app /usr/src/app

RUN mkdir -p /usr/src/app/archive
